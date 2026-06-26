'use client';
/* eslint-disable react-hooks/incompatible-library */

import * as React from 'react';
import {
  flexRender, getCoreRowModel, getSortedRowModel, getPaginationRowModel, useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Columns3, Download } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { SpeciesIcon } from '../../lib/icons';

const SPECIES_KEY = { tilapia: 'Tilapia', silure: 'Silure', crevette: 'Crevette', carpe: 'Carpe' };

export function OperatorsDataTable({ operators, t, lang, onExport }) {
  const [sorting, setSorting] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});

  const sortBtn = (column, label) => (
    <Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
      {label} <ArrowUpDown className="ml-1 size-3" />
    </Button>
  );

  const colLabel = {
    name: lang === 'fr' ? 'Nom' : 'Name', phone: lang === 'fr' ? 'Téléphone' : 'Phone',
    country: t.map.country, species: t.map.species, systems: t.map.system,
    production_range: t.register.production, actions: '',
  };

  const slug = (s) => (s || 'operator').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

  const columns = React.useMemo(() => [
    { accessorKey: 'name', header: ({ column }) => sortBtn(column, colLabel.name), cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    {
      accessorKey: 'phone', header: colLabel.phone, enableSorting: false,
      cell: ({ row }) => row.original.phone
        ? <a href={`tel:${row.original.phone}`} className="text-muted-foreground hover:text-[#0D6B8A] tabular-nums">{row.original.phone}</a>
        : <span className="text-muted-foreground">—</span>,
    },
    { accessorKey: 'country', header: ({ column }) => sortBtn(column, colLabel.country), cell: ({ row }) => <span className="text-muted-foreground">{row.original.country}</span> },
    {
      id: 'species', header: colLabel.species, enableSorting: false,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 flex-wrap">
          {(row.original.species || []).map(s => (
            <span key={s} className="inline-flex items-center gap-1"><SpeciesIcon name={SPECIES_KEY[s]} className="size-3.5 text-[#0D6B8A]" /> {SPECIES_KEY[s] || s}</span>
          ))}
        </span>
      ),
    },
    { id: 'systems', header: colLabel.systems, enableSorting: false, cell: ({ row }) => <span className="text-muted-foreground">{(row.original.systems || []).join(', ') || '—'}</span> },
    { accessorKey: 'production_range', header: () => <div className="text-right">{colLabel.production_range}</div>, enableSorting: false, cell: ({ row }) => <div className="text-right font-medium">{row.original.production_range || '—'}</div> },
    {
      id: 'actions', header: '', enableSorting: false, enableHiding: false,
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" className="size-8"
            title={lang === 'fr' ? 'Télécharger la fiche complète' : 'Download full record'}
            onClick={() => onExport?.([row.original], `aqafrika-${slug(row.original.name)}.csv`)}>
            <Download className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [t, lang, onExport]); // eslint-disable-line react-hooks/exhaustive-deps

  const table = useReactTable({
    data: operators, columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting, onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
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
              <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map(r => (
              <TableRow key={r.id}>{r.getVisibleCells().map(c => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}</TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground">{lang === 'fr' ? 'Aucune donnée pour le moment.' : 'No data yet.'}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{table.getRowModel().rows.length} / {operators.length}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="size-4" /></Button>
          <span className="text-xs tabular-nums">{table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}</span>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}
