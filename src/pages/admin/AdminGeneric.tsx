import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';

export default function AdminGeneric({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Données</h3>
          <Button variant="secondary" size="sm">Exporter</Button>
        </div>
        <Table headers={['Colonne 1', 'Colonne 2', 'Colonne 3', 'Statut', '']}>
          {[1, 2, 3, 4, 5].map(i => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">Élément {i}</td>
              <td className="py-3 px-4 text-gray-500">Donnée {i}</td>
              <td className="py-3 px-4 text-gray-700">{(i * 1000).toLocaleString()}</td>
              <td className="py-3 px-4"><Badge color="green">Actif</Badge></td>
              <td className="py-3 px-4"><button className="text-brand-600 text-sm hover:underline">Gérer</button></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
