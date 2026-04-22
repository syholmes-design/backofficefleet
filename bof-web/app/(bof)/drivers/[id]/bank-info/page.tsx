import Link from "next/link";
import { notFound } from "next/navigation";
import { BankInfoCard } from "@/components/drivers/BankInfoCard";
import { bankInfoByDriverId, bankInfoData } from "@/lib/bank-info/bankInfoData";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return bankInfoData.map((d) => ({ id: d.driverId }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const row = bankInfoByDriverId.get(id);
  return {
    title: row ? `${row.fullName} | Bank Info | BOF` : "Bank Info | BOF",
  };
}

export default async function DriverBankInfoPage({ params }: Props) {
  const { id } = await params;
  const row = bankInfoByDriverId.get(id);
  if (!row) notFound();

  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/drivers">Drivers</Link>
        <span aria-hidden> / </span>
        <Link href={`/drivers/${id}`}>{row.fullName}</Link>
        <span aria-hidden> / </span>
        <span>Bank Info</span>
      </nav>
      <p className="bof-small" style={{ margin: "0 0 0.65rem" }}>
        <Link href={`/drivers/${id}`} className="bof-link-secondary">
          Driver profile
        </Link>
        {" · "}
        <Link href="/emergency-contacts" className="bof-link-secondary">
          Emergency contacts
        </Link>
      </p>
      <BankInfoCard data={row} />
    </div>
  );
}

