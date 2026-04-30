import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, PauseCircle, PlayCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHostCars, useSnoozeCar, useUnsnoozeCar } from '@/hooks/use-host';
import { HostCarListDto, CarStatus } from '@/types';
import { formatUzs } from '@/lib/utils';

const STATUS_BADGES: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Listed: 'default',
  Rented: 'secondary',
  Snoozed: 'outline',
  PendingApproval: 'outline',
  Removed: 'outline',
  Draft: 'outline',
};

export default function HostCars() {
  const navigate = useNavigate();
  const { data: cars, isLoading } = useHostCars();
  const snooze = useSnoozeCar();
  const unsnooze = useUnsnoozeCar();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Cars</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your listed vehicles</p>
        </div>
        <Button onClick={() => navigate('/host/cars/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Listing
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !cars || cars.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No cars listed yet.</p>
          <p className="text-sm mt-1">Add your first car to start earning.</p>
          <Button className="mt-4" onClick={() => navigate('/host/cars/new')}>
            <Plus className="h-4 w-4 mr-2" />
            List a Car
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Daily Rate</TableHead>
                <TableHead className="text-right">Trips</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car: HostCarListDto) => (
                <TableRow key={car.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{car.make} {car.model} {car.year}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{car.vehicleTier ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGES[car.status] ?? 'outline'}>
                      {car.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatUzs(car.dailyPriceUsd)}
                  </TableCell>
                  <TableCell className="text-right text-sm">{car.tripCount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/cars/${car.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Listing
                        </DropdownMenuItem>
                        {car.status === CarStatus.Snoozed ? (
                          <DropdownMenuItem
                            onClick={() => unsnooze.mutate(car.id)}
                            disabled={unsnooze.isPending}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Unsnooze
                          </DropdownMenuItem>
                        ) : car.status === CarStatus.Listed ? (
                          <DropdownMenuItem
                            onClick={() => snooze.mutate(car.id)}
                            disabled={snooze.isPending}
                          >
                            <PauseCircle className="h-4 w-4 mr-2" />
                            Snooze
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
