import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BadgeCheck, Clock, X } from 'lucide-react';

interface ReviewFiltersProps {
  onFilter: (filters: ReviewFilters) => void;
}

export interface ReviewFilters {
  search: string;
  status: 'all' | 'approved' | 'pending';
  readStatus: 'all' | 'read' | 'unread';
}

export function ReviewFilters({ onFilter }: ReviewFiltersProps) {
  const [filters, setFilters] = useState<ReviewFilters>({
    search: '',
    status: 'all',
    readStatus: 'all',
  });

  const handleFilterChange = (
    key: keyof ReviewFilters,
    value: string
  ) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters: ReviewFilters = {
      search: '',
      status: 'all',
      readStatus: 'all',
    };
    
    setFilters(defaultFilters);
    onFilter(defaultFilters);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar por nombre o comentario"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">Estado de aprobación</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="approved">
                <div className="flex items-center">
                  <BadgeCheck className="mr-2 h-4 w-4 text-green-500" />
                  <span>Aprobadas</span>
                </div>
              </SelectItem>
              <SelectItem value="pending">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Pendientes</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="readStatus">Estado de lectura</Label>
          <Select
            value={filters.readStatus}
            onValueChange={(value) => handleFilterChange('readStatus', value)}
          >
            <SelectTrigger id="readStatus">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="read">Leídas</SelectItem>
              <SelectItem value="unread">No leídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleClearFilters}
          >
            <X className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 