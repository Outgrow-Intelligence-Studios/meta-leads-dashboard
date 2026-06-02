import { Badge } from "@/components/base/badges/badges";
import { Table, TableCard } from "@/components/application/table/table";

const campaigns = [
  { name: "Summer Sale \u2014 IG Reels", spend: "$1,240", leads: 18, status: "Active", cpl: "$68.89" },
  { name: "Lead Gen \u2014 FB Form", spend: "$890", leads: 12, status: "Active", cpl: "$74.17" },
  { name: "Retarget \u2014 Messenger", spend: "$520", leads: 7, status: "Paused", cpl: "$74.29" },
  { name: "Brand Awareness \u2014 Stories", spend: "$1,100", leads: 9, status: "Active", cpl: "$122.22" },
  { name: "WhatsApp Click \u2014 Promotion", spend: "$670", leads: 5, status: "Ended", cpl: "$134.00" },
];

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">Campaigns</h2>
        <p className="text-sm text-tertiary mt-0.5">
          Your Meta Ads campaigns and their performance.
        </p>
      </div>

      <TableCard.Root>
        <Table aria-label="Campaigns">
          <Table.Header>
            <Table.Head isRowHeader>Campaign</Table.Head>
            <Table.Head>Spend</Table.Head>
            <Table.Head>Leads</Table.Head>
            <Table.Head>CPL</Table.Head>
            <Table.Head>Status</Table.Head>
          </Table.Header>
          <Table.Body>
            {campaigns.map((c) => (
              <Table.Row key={c.name}>
                <Table.Cell>
                  <span className="font-medium text-primary">{c.name}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-secondary">{c.spend}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-secondary">{c.leads}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-secondary">{c.cpl}</span>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    color={
                      c.status === "Active" ? "success" :
                      c.status === "Paused" ? "warning" :
                      "gray"
                    }
                    size="sm"
                    type="pill-color"
                  >
                    {c.status}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </TableCard.Root>
    </div>
  );
}
