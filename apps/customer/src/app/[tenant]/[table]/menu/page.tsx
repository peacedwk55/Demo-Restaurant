import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import MenuScreen from '@/components/MenuScreen'

interface Props {
  params: { tenant: string; table: string }
}

export default async function MenuPage({ params }: Props) {
  const [menu, table] = await Promise.all([
    api.getMenu(params.tenant).catch(() => null),
    api.getTable(params.tenant, params.table.toUpperCase()).catch(() => null),
  ])

  if (!menu || !table) notFound()

  return (
    <MenuScreen
      menu={menu}
      tableId={table.id}
      tableCode={table.name}
      tenant={params.tenant}
      table={params.table}
      apiOrderId={table.activeOrderId}
    />
  )
}
