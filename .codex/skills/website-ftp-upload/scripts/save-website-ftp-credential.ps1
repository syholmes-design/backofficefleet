[CmdletBinding()]
param(
    [string]$CredentialPath,
    [int]$Iterations = 200000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-FullPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    return [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Path).Path)
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

function New-RandomBytes {
    param([Parameter(Mandatory = $true)][int]$Count)
    $bytes = New-Object byte[] $Count
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($bytes)
    }
    finally {
        $rng.Dispose()
    }
    return $bytes
}

$projectRoot = Resolve-FullPath -Path (Join-Path $PSScriptRoot "..\..\..\..")
if ([string]::IsNullOrWhiteSpace($CredentialPath)) {
    $CredentialPath = Join-Path $projectRoot ".codex\secrets\website-ftps-credential.json"
}

$username = Read-Host -Prompt "Enter BOF FTPS username"
$passwordSecure = Read-Host -Prompt "Enter BOF FTPS password" -AsSecureString
$passphraseSecure = Read-Host -Prompt "Create credential-file passphrase" -AsSecureString
$passphraseConfirmSecure = Read-Host -Prompt "Confirm credential-file passphrase" -AsSecureString

$password = Convert-SecureStringToPlainText -SecureString $passwordSecure
$passphrase = Convert-SecureStringToPlainText -SecureString $passphraseSecure
$passphraseConfirm = Convert-SecureStringToPlainText -SecureString $passphraseConfirmSecure

if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($password)) {
    throw "Username and password are required."
}

if ([string]::IsNullOrWhiteSpace($passphrase) -or $passphrase -ne $passphraseConfirm) {
    throw "Credential-file passphrase is empty or does not match confirmation."
}

$salt = New-RandomBytes -Count 16
$kdf = [System.Security.Cryptography.Rfc2898DeriveBytes]::new($passphrase, $salt, $Iterations)
try {
    $key = $kdf.GetBytes(32)
    $hmacKey = $kdf.GetBytes(32)
}
finally {
    $kdf.Dispose()
}

$plainJson = [pscustomobject]@{
    username = $username
    password = $password
} | ConvertTo-Json -Compress
$plainBytes = [System.Text.Encoding]::UTF8.GetBytes($plainJson)

$aes = [System.Security.Cryptography.Aes]::Create()
try {
    $aes.KeySize = 256
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key = $key
    $aes.GenerateIV()
    $iv = $aes.IV
    $encryptor = $aes.CreateEncryptor()
    try {
        $ciphertext = $encryptor.TransformFinalBlock($plainBytes, 0, $plainBytes.Length)
    }
    finally {
        $encryptor.Dispose()
    }
}
finally {
    $aes.Dispose()
}

$hmac = [System.Security.Cryptography.HMACSHA256]::new($hmacKey)
try {
    $payload = Join-Bytes $salt $iv $ciphertext
    $signature = $hmac.ComputeHash($payload)
}
finally {
    $hmac.Dispose()
}

$credentialFolder = Split-Path -Path $CredentialPath -Parent
if (-not (Test-Path -LiteralPath $credentialFolder)) {
    New-Item -ItemType Directory -Path $credentialFolder -Force | Out-Null
}

[pscustomobject]@{
    version = 1
    algorithm = "AES-256-CBC-HMACSHA256"
    kdf = "PBKDF2-SHA1"
    iterations = $Iterations
    salt = [System.Convert]::ToBase64String($salt)
    iv = [System.Convert]::ToBase64String($iv)
    ciphertext = [System.Convert]::ToBase64String($ciphertext)
    hmac = [System.Convert]::ToBase64String($signature)
} | ConvertTo-Json | Set-Content -LiteralPath $CredentialPath -Encoding UTF8

[pscustomobject]@{
    Mode = "Saved"
    CredentialPath = $CredentialPath
    PlaintextStored = $false
    PortableToNewComputer = $true
    RequiresPassphraseAtUpload = $true
} | Format-List
