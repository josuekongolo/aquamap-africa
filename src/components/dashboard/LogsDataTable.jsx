'use client';
/* eslint-disable react-hooks/incompatible-library */

import * as React from 'react';
import {
  flexRender, getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel, useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Columns3 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

// TanStack data table (dashboard-01 style) for an operator's production logs.
export function LogsDataTable({ logs, t }) {
  const [sorting, setSorting] = React.useState([{ id: 'log_date', desc: true }]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [tab, setTab] = React.useState('all');

  const typeLabel = { feed: t.dashboard.feeding, harvest: t.dashboard.harvest, stocking: t.dashboard.stocking };
  const colLabel = { log_date: t.dashboard.date, type: t.dashboard.logType, species: t.dashboard.species, qty: 'kg / qty' };

  const columns = React.useMemo(() => [
    {
      accessorKey: 'log_date',
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t.dashboard.date} <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.log_date}</span>,
    },
    {
      accessorKey: 'type',
      header: t.dashboard.logType,
      cell: ({ row }) => <Badge variant="secondary">{typeLabel[row.original.type]}</Badge>,
    },
    {
      accessorKey: 'species',
      header: t.dashboard.species,
      cell: ({ row }) => row.original.species || '—',
    },
    {
      id: 'qty',
      header: () => <div className="text-right">kg / qty</div>,
      cell: ({ row }) => {
        const l = row.original;
        const v = l.type === 'feed' ? `${l.feed_kg} kg`
          : l.type === 'harvest' ? `${l.kg_harvested} kg`
          : `${l.fingerlings_count ?? '—'} × ${l.avg_weight_g ?? '—'} g`;
        return <div className="text-right font-medium tabular-nums">{v}</div>;
      },
      enableSorting: false,
    },
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const data = React.useMemo(() => (tab === 'all' ? logs : logs.filter(l => l.type === tab)), [logs, tab]);

  const table = useReactTable({
    data, columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">{t.map.all}</TabsTrigger>
            <TabsTrigger value="stocking">{t.dashboard.stocking}</TabsTrigger>
            <TabsTrigger value="feed">{t.dashboard.feeding}</TabsTrigger>
            <TabsTrigger value="harvest">{t.dashboard.harvest}</TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm"><Columns3 className="size-4" /> Colonnes</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns().filter(c => c.getCanHide()).map(c => (
              <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={v => c.toggleVisibility(!!v)}>
                {colLabel[c.id] || c.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map(r => (
              <TableRow key={r.id}>
                {r.getVisibleCells().map(c => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground">{t.dashboard.noLogs}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} {t.dashboard.logType.toLowerCase()}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="size-4" /></Button>
          <span className="text-xs tabular-nums">{table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}</span>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}
