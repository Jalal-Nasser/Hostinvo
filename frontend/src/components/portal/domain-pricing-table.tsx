import { portalTheme } from "@/components/portal/portal-theme";

type DomainPricingRow = {
  extension: string;
  register: string;
  transfer: string;
  renew: string;
};

type DomainPricingTableProps = {
  kicker: string;
  title: string;
  description: string;
  extensionLabel: string;
  registerLabel: string;
  transferLabel: string;
  renewLabel: string;
  rows: DomainPricingRow[];
  note: string;
};

export function DomainPricingTable({
  kicker,
  title,
  description,
  extensionLabel,
  registerLabel,
  transferLabel,
  renewLabel,
  rows,
  note,
}: DomainPricingTableProps) {
  return (
    <div className="space-y-6">
      <section className={[portalTheme.panelClass, "ps-6 pe-6 py-6 md:ps-7 md:pe-7 md:py-7"].join(" ")}>
        <p className={portalTheme.sectionKickerClass}>{kicker}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">{description}</p>
      </section>

      <section className={portalTheme.tableShellClass}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[rgba(104,123,158,0.12)] bg-[rgba(255,255,255,0.03)] text-[#dbe7ff]">
              <th className="ps-5 pe-5 py-4 text-start font-semibold">{extensionLabel}</th>
              <th className="ps-5 pe-5 py-4 text-start font-semibold">{registerLabel}</th>
              <th className="ps-5 pe-5 py-4 text-start font-semibold">{transferLabel}</th>
              <th className="ps-5 pe-5 py-4 text-start font-semibold">{renewLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.extension}
                className="border-b border-[rgba(104,123,158,0.08)] text-[#b9c7df] last:border-b-0"
              >
                <td className="ps-5 pe-5 py-4 font-semibold text-white">{row.extension}</td>
                <td className="ps-5 pe-5 py-4">{row.register}</td>
                <td className="ps-5 pe-5 py-4">{row.transfer}</td>
                <td className="ps-5 pe-5 py-4">{row.renew}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className={portalTheme.noteClass}>{note}</div>
    </div>
  );
}
