[CmdletBinding()]
param(
    [string]$Server = "ftp.backofficefleet.com",
    [int]$Port = 21,
    [string]$Username = $env:BOF_FTP_USERNAME,
    [string]$Password = $env:BOF_FTP_PASSWORD,
    [string]$CredentialPath,
    [string]$CredentialPassphrase = $env:BOF_FTP_CREDENTIAL_PASSPHRASE,
    [string]$RemoteRoot = "/",
    [string]$LocalRoot,
    [string]$ManifestName = ".bof-deploy-manifest.json",
    [int]$TimestampToleranceSeconds = 2,
    [switch]$AllowInvalidCertificate,
    [switch]$ForceFullUpload,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
$ProtocolLabel = "Explicit FTPS (FTP over TLS)"
$EffectiveUsername = $Username
$EffectivePassword = $Password
$CredentialSource = if ([string]::IsNullOrWhiteSpace($Password)) { "None" } else { "Runtime" }
$EnsuredRemoteDirectories = @{}

if ($AllowInvalidCertificate) {
    if ($Server -ne "ftp.backofficefleet.com") {
        throw "Certificate validation bypass is only allowed for ftp.backofficefleet.com in this BOF uploader."
    }
    Write-Warning "FTPS certificate validation bypass is enabled for this upload process. TLS remains enabled, but the remote certificate will not be trusted/verified."
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
}

function Join-Bytes {
    param([Parameter(ValueFromRemainingArguments = $true)][byte[][]]$Arrays)
    $length = 0
    foreach ($array in $Arrays) {
        $length += $array.Length
    }
    $joined = New-Object byte[] $length
    $offset = 0
    foreach ($array in $Arrays) {
        [System.Buffer]::BlockCopy($array, 0, $joined, $offset, $array.Length)
        $offset += $array.Length
    }
    return $joined
}

function Test-SameBytes {
    param(
        [Parameter(Mandatory = $true)][byte[]]$Left,
        [Parameter(Mandatory = $true)][byte[]]$Right
    )
    if ($Left.Length -ne $Right.Length) {
        return $false
    }
    $diff = 0
    for ($i = 0; $i -lt $Left.Length; $i++) {
        $diff = $diff -bor ($Left[$i] -bxor $Right[$i])
    }
    return ($diff -eq 0)
}

function Convert-SecureStringToPlainText {
    param([Parameter(Mandatory = $true)][securestring]$SecureString)
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

function Read-EncryptedCredential {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Passphrase
    )

    $credential = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    $iterations = [int]$credential.iterations
    $salt = [System.Convert]::FromBase64String([string]$credential.salt)
    $iv = [System.Convert]::FromBase64String([string]$credential.iv)
    $ciphertext = [System.Convert]::FromBase64String([string]$credential.ciphertext)
    $storedHmac = [System.Convert]::FromBase64String([string]$credential.hmac)

    $kdf = [System.Security.Cryptography.Rfc2898DeriveBytes]::new($Passphrase, $salt, $iterations)
    try {
        $key = $kdf.GetBytes(32)
        $hmacKey = $kdf.GetBytes(32)
    }
    finally {
        $kdf.Dispose()
    }

    $hmac = [System.Security.Cryptography.HMACSHA256]::new($hmacKey)
    try {
        $payload = Join-Bytes $salt $iv $ciphertext
        $actualHmac = $hmac.ComputeHash($payload)
    }
    finally {
        $hmac.Dispose()
    }

    if (-not (Test-SameBytes -Left $storedHmac -Right $actualHmac)) {
        throw "Encrypted FTP credential could not be verified. Check the credential file and passphrase."
    }

    $aes = [System.Security.Cryptography.Aes]::Create()
    try {
        $aes.KeySize = 256
        $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
        $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
        $aes.Key = $key
        $aes.IV = $iv
        $decryptor = $aes.CreateDecryptor()
        try {
            $plainBytes = $decryptor.TransformFinalBlock($ciphertext, 0, $ciphertext.Length)
        }
        finally {
            $decryptor.Dispose()
        }
    }
    finally {
        $aes.Dispose()
    }

    $plainJson = [System.Text.Encoding]::UTF8.GetString($plainBytes)
    return ($plainJson | ConvertFrom-Json)
}

function Resolve-UploadCredential {
    if (-not [string]::IsNullOrWhiteSpace($EffectiveUsername) -and -not [string]::IsNullOrWhiteSpace($EffectivePassword)) {
        return
    }

    if ([string]::IsNullOrWhiteSpace($CredentialPath) -or -not (Test-Path -LiteralPath $CredentialPath)) {
        return
    }

    if ([string]::IsNullOrWhiteSpace($CredentialPassphrase)) {
        $securePassphrase = Read-Host -Prompt "Enter BOF encrypted FTP credential passphrase" -AsSecureString
        $script:CredentialPassphrase = Convert-SecureStringToPlainText -SecureString $securePassphrase
    }

    $credential = Read-EncryptedCredential -Path $CredentialPath -Passphrase $CredentialPassphrase
    $script:EffectiveUsername = [string]$credential.username
    $script:EffectivePassword = [string]$credential.password
    $script:CredentialSource = "Encrypted credential file"
}

function Test-HasRuntimeCredential {
    if (-not [string]::IsNullOrWhiteSpace($EffectiveUsername) -and -not [string]::IsNullOrWhiteSpace($EffectivePassword)) {
        return $true
    }

    if (-not [string]::IsNullOrWhiteSpace($CredentialPath) -and
        (Test-Path -LiteralPath $CredentialPath) -and
        -not [string]::IsNullOrWhiteSpace($CredentialPassphrase)) {
        return $true
    }

    return $false
}

function Resolve-FullPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    return [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Path).Path)
}

function Convert-ToFtpPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    $parts = @($Path -split "[\\/]+" | Where-Object { $_ -ne "" })
    if ($parts.Count -eq 0) {
        return ""
    }
    return ($parts | ForEach-Object { [System.Uri]::EscapeDataString($_) }) -join "/"
}

function Join-RemotePath {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [string]$RelativePath
    )
    $cleanRoot = "/" + ($Root.Trim("/") )
    if ($cleanRoot -eq "/") {
        $cleanRoot = ""
    }
    $encodedRelative = Convert-ToFtpPath -Path $RelativePath
    if ([string]::IsNullOrWhiteSpace($encodedRelative)) {
        return $cleanRoot
    }
    return "$cleanRoot/$encodedRelative"
}

function New-FtpRequest {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [Parameter(Mandatory = $true)][string]$Method
    )
    $request = [System.Net.FtpWebRequest]::Create($Uri)
    $request.Method = $Method
    $request.Credentials = [System.Net.NetworkCredential]::new($EffectiveUsername, $EffectivePassword)
    $request.EnableSsl = $true
    $request.UseBinary = $true
    $request.UsePassive = $true
    $request.KeepAlive = $false
    if (-not $request.EnableSsl) {
        throw "Unsafe FTP request blocked. This uploader requires explicit FTPS and has no plain-FTP fallback."
    }
    return $request
}

function Test-IsMissingRemoteItemError {
    param([Parameter(Mandatory = $true)][System.Net.WebException]$Exception)

    $response = $Exception.Response
    if ($response -eq $null) {
        return $false
    }

    try {
        return ($response.StatusCode -eq [System.Net.FtpStatusCode]::ActionNotTakenFileUnavailable)
    }
    finally {
        $response.Close()
    }
}

function Get-FileSha256 {
    param([Parameter(Mandatory = $true)][string]$Path)

    $sha = [System.Security.Cryptography.SHA256]::Create()
    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $hash = $sha.ComputeHash($stream)
        return ([System.BitConverter]::ToString($hash) -replace "-", "").ToLowerInvariant()
    }
    finally {
        $stream.Close()
        $sha.Dispose()
    }
}

function Download-RemoteTextFile {
    param([Parameter(Mandatory = $true)][string]$RemotePath)

    $uri = "ftp://$Server`:$Port$RemotePath"
    try {
        return Invoke-WithRetry -Label "Download $RemotePath" -Operation {
            $request = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::DownloadFile)
            $response = $request.GetResponse()
            try {
                $stream = $response.GetResponseStream()
                $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)
                try {
                    return $reader.ReadToEnd()
                }
                finally {
                    $reader.Close()
                }
            }
            finally {
                $response.Close()
            }
        }
    }
    catch [System.Net.WebException] {
        if (Test-IsMissingRemoteItemError -Exception $_.Exception) {
            return $null
        }
        throw
    }
}

function Get-RemoteFileSize {
    param([Parameter(Mandatory = $true)][string]$RemotePath)

    $uri = "ftp://$Server`:$Port$RemotePath"
    try {
        return Invoke-WithRetry -Label "Get remote size $RemotePath" -Operation {
            $request = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::GetFileSize)
            $response = $request.GetResponse()
            try {
                return [int64]$response.ContentLength
            }
            finally {
                $response.Close()
            }
        }
    }
    catch [System.Net.WebException] {
        if (Test-IsMissingRemoteItemError -Exception $_.Exception) {
            return $null
        }
        throw
    }
}

function Get-RemoteFileTimestampUtc {
    param([Parameter(Mandatory = $true)][string]$RemotePath)

    $uri = "ftp://$Server`:$Port$RemotePath"
    try {
        return Invoke-WithRetry -Label "Get remote timestamp $RemotePath" -Operation {
            $request = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::GetDateTimestamp)
            $response = $request.GetResponse()
            try {
                return $response.LastModified.ToUniversalTime()
            }
            finally {
                $response.Close()
            }
        }
    }
    catch [System.Net.WebException] {
        if (Test-IsMissingRemoteItemError -Exception $_.Exception) {
            return $null
        }
        throw
    }
}

function Get-RemoteManifestMap {
    param([Parameter(Mandatory = $true)][string]$RemoteManifestPath)

    $manifestText = Download-RemoteTextFile -RemotePath $RemoteManifestPath
    $map = @{}
    if ([string]::IsNullOrWhiteSpace($manifestText)) {
        return [pscustomobject]@{
            Exists = $false
            Map = $map
        }
    }

    $manifest = $manifestText | ConvertFrom-Json
    foreach ($entry in @($manifest.files)) {
        $map[[string]$entry.relativePath] = $entry
    }

    return [pscustomobject]@{
        Exists = $true
        Map = $map
    }
}

function Upload-Bytes {
    param(
        [Parameter(Mandatory = $true)][string]$RemotePath,
        [Parameter(Mandatory = $true)][byte[]]$Bytes
    )

    $uri = "ftp://$Server`:$Port$RemotePath"
    Invoke-WithRetry -Label "Upload $RemotePath" -Operation {
        $request = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::UploadFile)
        $request.ContentLength = $Bytes.Length
        $stream = $request.GetRequestStream()
        try {
            $stream.Write($Bytes, 0, $Bytes.Length)
        }
        finally {
            $stream.Close()
        }
        $response = $request.GetResponse()
        $response.Close()
    } | Out-Null
}

function Upload-LocalFile {
    param(
        [Parameter(Mandatory = $true)][string]$LocalPath,
        [Parameter(Mandatory = $true)][string]$RemotePath
    )

    $bytes = [System.IO.File]::ReadAllBytes($LocalPath)
    Upload-Bytes -RemotePath $RemotePath -Bytes $bytes
}

function Invoke-WithRetry {
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Operation,
        [Parameter(Mandatory = $true)][string]$Label,
        [int]$Attempts = 3
    )

    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        try {
            return & $Operation
        }
        catch {
            if ($attempt -ge $Attempts) {
                throw
            }
            $delay = [Math]::Min(10, 2 * $attempt)
            Write-Warning "$Label failed on attempt $attempt of $Attempts. Retrying in $delay seconds. $($_.Exception.Message)"
            Start-Sleep -Seconds $delay
        }
    }
}

function Ensure-RemoteDirectory {
    param([Parameter(Mandatory = $true)][string]$RemoteDirectory)

    if ([string]::IsNullOrWhiteSpace($RemoteDirectory) -or $RemoteDirectory -eq "/") {
        return
    }

    $normalizedDirectory = "/" + $RemoteDirectory.Trim("/")
    if ($script:EnsuredRemoteDirectories.ContainsKey($normalizedDirectory)) {
        return
    }

    $segments = $RemoteDirectory.Trim("/") -split "/" | Where-Object { $_ -ne "" }
    $current = ""
    foreach ($segment in $segments) {
        $current = "$current/$segment"
        if ($script:EnsuredRemoteDirectories.ContainsKey($current)) {
            continue
        }
        $uri = "ftp://$Server`:$Port$current"
        try {
            $request = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::MakeDirectory)
            $response = $request.GetResponse()
            $response.Close()
        }
        catch [System.Net.WebException] {
            $response = $_.Exception.Response
            if ($response -eq $null) {
                throw
            }
            try {
                if ($response.StatusCode -ne [System.Net.FtpStatusCode]::ActionNotTakenFileUnavailable) {
                    throw
                }
            }
            finally {
                $response.Close()
            }
        }
        $script:EnsuredRemoteDirectories[$current] = $true
    }
    $script:EnsuredRemoteDirectories[$normalizedDirectory] = $true
}

function New-UploadPlan {
    param(
        [Parameter(Mandatory = $true)][array]$Files,
        [Parameter(Mandatory = $true)][string]$RemoteManifestPath,
        [Parameter(Mandatory = $true)][bool]$UseRemoteComparison
    )

    $manifestInfo = [pscustomobject]@{
        Exists = $false
        Map = @{}
    }

    if ($UseRemoteComparison -and -not $ForceFullUpload) {
        $manifestInfo = Get-RemoteManifestMap -RemoteManifestPath $RemoteManifestPath
    }

    $plan = foreach ($file in $Files) {
        $action = "Upload"
        $reason = "Remote comparison unavailable"
        $remoteSize = $null
        $remoteTimestampUtc = $null
        $manifestHash = $null
        $manifestLength = $null
        $manifestMatched = $false

        if ($ForceFullUpload) {
            $reason = "ForceFullUpload"
        }
        elseif ($UseRemoteComparison) {
            $manifestEntry = $manifestInfo.Map[$file.RelativePath]
            if ($null -ne $manifestEntry) {
                $manifestHash = [string]$manifestEntry.sha256
                $manifestLength = [int64]$manifestEntry.length
            }

            $remoteSize = Get-RemoteFileSize -RemotePath $file.RemotePath
            if ($null -eq $remoteSize) {
                $reason = "RemoteMissing"
            }
            else {
                $remoteTimestampUtc = Get-RemoteFileTimestampUtc -RemotePath $file.RemotePath
                $manifestMatched = (
                    $null -ne $manifestEntry -and
                    $manifestHash -eq $file.Sha256 -and
                    $manifestLength -eq $file.Length
                )

                if ($manifestMatched -and $remoteSize -eq $file.Length) {
                    $action = "Skip"
                    $reason = "HashSizeMatch"
                }
                elseif ($remoteSize -ne $file.Length) {
                    $reason = "SizeChanged"
                }
                elseif ($null -ne $manifestEntry -and $manifestHash -ne $file.Sha256) {
                    $reason = "HashChanged"
                }
                elseif ($null -eq $manifestEntry) {
                    if ($null -eq $remoteTimestampUtc) {
                        $reason = "NoHashOrTimestamp"
                    }
                    elseif ($file.LastWriteTimeUtc -gt $remoteTimestampUtc.AddSeconds($TimestampToleranceSeconds)) {
                        $reason = "TimestampNewer"
                    }
                    else {
                        $action = "Skip"
                        $reason = "SizeTimestampMatch"
                    }
                }
                elseif ($manifestLength -ne $file.Length) {
                    $reason = "ManifestSizeChanged"
                }
                elseif ($null -ne $remoteTimestampUtc -and $file.LastWriteTimeUtc -le $remoteTimestampUtc.AddSeconds($TimestampToleranceSeconds)) {
                    $action = "Skip"
                    $reason = "TimestampMatch"
                }
                else {
                    $reason = "TimestampNewer"
                }
            }
        }

        [pscustomobject]@{
            Action = $action
            Reason = $reason
            RelativePath = $file.RelativePath
            FullName = $file.FullName
            Length = $file.Length
            Sha256 = $file.Sha256
            LastWriteTimeUtc = $file.LastWriteTimeUtc
            RemotePath = $file.RemotePath
            RemoteSize = $remoteSize
            RemoteTimestampUtc = $remoteTimestampUtc
            ManifestHash = $manifestHash
            ManifestLength = $manifestLength
            ManifestMatched = $manifestMatched
        }
    }

    return [pscustomobject]@{
        ManifestExists = $manifestInfo.Exists
        Plan = @($plan)
    }
}

function New-DeployManifestJson {
    param([Parameter(Mandatory = $true)][array]$Files)

    $manifest = [ordered]@{
        schemaVersion = 1
        generatedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
        localRootName = "Website"
        remoteRoot = $RemoteRoot
        excludedFiles = @(".htaccess")
        files = @($Files | ForEach-Object {
            [ordered]@{
                relativePath = $_.RelativePath
                length = $_.Length
                sha256 = $_.Sha256
                lastWriteTimeUtc = $_.LastWriteTimeUtc.ToString("o")
            }
        })
    }

    return ($manifest | ConvertTo-Json -Depth 6)
}

$projectRoot = Resolve-FullPath -Path (Join-Path $PSScriptRoot "..\..\..\..")
$expectedWebsiteRoot = Resolve-FullPath -Path (Join-Path $projectRoot "Website")

if ([string]::IsNullOrWhiteSpace($CredentialPath)) {
    $CredentialPath = Join-Path $projectRoot ".codex\secrets\website-ftps-credential.json"
}

if ([string]::IsNullOrWhiteSpace($LocalRoot)) {
    $LocalRoot = $expectedWebsiteRoot
}

$resolvedLocalRoot = Resolve-FullPath -Path $LocalRoot
if ($resolvedLocalRoot -ne $expectedWebsiteRoot) {
    throw "Refusing FTP upload from '$resolvedLocalRoot'. This BOF uploader is locked to '$expectedWebsiteRoot'."
}

$files = Get-ChildItem -LiteralPath $resolvedLocalRoot -Recurse -File -Force |
    Sort-Object FullName |
    ForEach-Object {
        $relative = $_.FullName.Substring($resolvedLocalRoot.Length).TrimStart([char[]]@("\", "/"))
        [pscustomobject]@{
            FullName = $_.FullName
            RelativePath = $relative
            Length = $_.Length
            Sha256 = Get-FileSha256 -Path $_.FullName
            LastWriteTimeUtc = $_.LastWriteTimeUtc
            RemotePath = Join-RemotePath -Root $RemoteRoot -RelativePath $relative
        }
    }

$excludedFiles = @($files | Where-Object { $_.RelativePath -ieq ".htaccess" })
$files = @($files | Where-Object { $_.RelativePath -ine ".htaccess" })
$remoteManifestPath = Join-RemotePath -Root $RemoteRoot -RelativePath $ManifestName
$useRemoteComparison = $false

if ($DryRun) {
    if (-not $ForceFullUpload -and (Test-HasRuntimeCredential)) {
        Resolve-UploadCredential
        $useRemoteComparison = $true
    }
}
else {
    Resolve-UploadCredential
    if (-not $ForceFullUpload) {
        $useRemoteComparison = $true
    }
}

if (-not $DryRun -and ([string]::IsNullOrWhiteSpace($EffectiveUsername) -or [string]::IsNullOrWhiteSpace($EffectivePassword))) {
    throw "FTP credentials missing. Use save-website-ftp-credential.ps1 to create an encrypted credential file, or set `$env:BOF_FTP_USERNAME and `$env:BOF_FTP_PASSWORD at runtime."
}

$uploadPlanResult = New-UploadPlan -Files @($files) -RemoteManifestPath $remoteManifestPath -UseRemoteComparison $useRemoteComparison
$uploadPlan = @($uploadPlanResult.Plan)
$filesToUpload = @($uploadPlan | Where-Object { $_.Action -eq "Upload" })
$skippedFiles = @($uploadPlan | Where-Object { $_.Action -eq "Skip" })

if ($DryRun) {
    [pscustomobject]@{
        Mode = "DryRun"
        LocalRoot = $resolvedLocalRoot
        RemoteRoot = $RemoteRoot
        RemoteManifest = $remoteManifestPath
        RemoteManifestExists = $uploadPlanResult.ManifestExists
        Server = $Server
        Port = $Port
        Protocol = $ProtocolLabel
        TlsRequired = $true
        PlainFtpFallback = $false
        CertificateValidationBypassed = [bool]$AllowInvalidCertificate
        RemoteComparison = $useRemoteComparison
        ForceFullUpload = [bool]$ForceFullUpload
        CredentialFile = $CredentialPath
        CredentialFileExists = (Test-Path -LiteralPath $CredentialPath)
        FileCount = @($files).Count
        ExcludedFileCount = @($excludedFiles).Count
        ExcludedFiles = (($excludedFiles | ForEach-Object { $_.RelativePath }) -join ", ")
        TotalBytes = ($files | Measure-Object -Property Length -Sum).Sum
        UploadFileCount = @($filesToUpload).Count
        UploadBytes = ($filesToUpload | Measure-Object -Property Length -Sum).Sum
        SkippedFileCount = @($skippedFiles).Count
    } | Format-List
    $uploadPlan |
        Select-Object Action, Reason, RelativePath, Length, RemoteSize, RemoteTimestampUtc, Sha256, RemotePath |
        Format-Table -AutoSize
    return
}

$uploaded = 0
foreach ($file in $filesToUpload) {
    $remoteDirectory = Split-Path -Path $file.RemotePath -Parent
    $remoteDirectory = $remoteDirectory -replace "\\", "/"
    Ensure-RemoteDirectory -RemoteDirectory $remoteDirectory

    Write-Host "Uploading $($file.RelativePath) -> $($file.RemotePath) [$($file.Reason)]"
    Upload-LocalFile -LocalPath $file.FullName -RemotePath $file.RemotePath
    $uploaded++
}

$manifestUploaded = $false
$shouldUploadManifest = ($uploaded -gt 0 -or -not $uploadPlanResult.ManifestExists -or $ForceFullUpload)
if ($shouldUploadManifest) {
    $manifestJson = New-DeployManifestJson -Files @($files)
    $manifestBytes = [System.Text.Encoding]::UTF8.GetBytes($manifestJson)
    $manifestDirectory = Split-Path -Path $remoteManifestPath -Parent
    $manifestDirectory = $manifestDirectory -replace "\\", "/"
    Ensure-RemoteDirectory -RemoteDirectory $manifestDirectory
    Write-Host "Uploading deploy manifest -> $remoteManifestPath"
    Upload-Bytes -RemotePath $remoteManifestPath -Bytes $manifestBytes
    $manifestUploaded = $true
}

[pscustomobject]@{
    Mode = "Uploaded"
    LocalRoot = $resolvedLocalRoot
    RemoteRoot = $RemoteRoot
    RemoteManifest = $remoteManifestPath
    RemoteManifestExistsBeforeUpload = $uploadPlanResult.ManifestExists
    Server = $Server
    Port = $Port
    Protocol = $ProtocolLabel
    TlsRequired = $true
    PlainFtpFallback = $false
    CertificateValidationBypassed = [bool]$AllowInvalidCertificate
    RemoteComparison = $useRemoteComparison
    ForceFullUpload = [bool]$ForceFullUpload
    ManifestUploaded = $manifestUploaded
    CredentialSource = $CredentialSource
    LocalFileCount = @($files).Count
    UploadedFileCount = $uploaded
    SkippedFileCount = @($skippedFiles).Count
    ExcludedFileCount = @($excludedFiles).Count
    ExcludedFiles = (($excludedFiles | ForEach-Object { $_.RelativePath }) -join ", ")
    UploadedBytes = ($filesToUpload | Measure-Object -Property Length -Sum).Sum
    LocalTotalBytes = ($files | Measure-Object -Property Length -Sum).Sum
} | Format-List
