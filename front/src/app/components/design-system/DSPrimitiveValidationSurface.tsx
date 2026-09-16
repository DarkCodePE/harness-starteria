import { Bell, Check, Info, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import { IconButton } from '../ui/icon-button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { DSPatternValidationSurface } from './patterns';
import { DomainStatusBadgeValidationSurface } from './status';

export function DSPrimitiveValidationSurface() {
  return (
    <section className="space-y-6 rounded-ds-lg border border-border-default bg-surface-default p-6 text-text-primary">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <IconButton aria-label="Dismiss">
          <X />
        </IconButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Label htmlFor="ds-input">Input</Label>
        <Input id="ds-input" placeholder="Placeholder" />
        <Label htmlFor="ds-textarea">Textarea</Label>
        <Textarea id="ds-textarea" placeholder="Longer text" />
        <Select>
          <SelectTrigger aria-label="Example select">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one">One</SelectItem>
            <SelectItem value="two">Two</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Checkbox aria-label="Checkbox example" />
        <RadioGroup aria-label="Density" className="flex gap-3">
          <RadioGroupItem value="compact" aria-label="Compact" />
          <RadioGroupItem value="comfortable" aria-label="Comfortable" />
        </RadioGroup>
        <Switch aria-label="Switch example" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Neutral structural card.</CardDescription>
        </CardHeader>
        <CardContent>Card content</CardContent>
        <CardFooter>
          <Button variant="secondary" size="sm">Action</Button>
        </CardFooter>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Dialog trigger</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>Focused confirmation surface.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="secondary">Drawer trigger</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer title</DrawerTitle>
              <DrawerDescription>Contextual secondary surface.</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost">
              <Info />
              Tooltip
            </Button>
          </TooltipTrigger>
          <TooltipContent>Helpful non-critical information</TooltipContent>
        </Tooltip>
      </div>

      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First tab</TabsContent>
        <TabsContent value="two">Second tab</TabsContent>
      </Tabs>

      <div className="grid gap-3">
        <Alert variant="info">
          <Info />
          <AlertTitle>Info alert</AlertTitle>
          <AlertDescription>Generic feedback only.</AlertDescription>
        </Alert>
        <Alert variant="success">
          <Check />
          <AlertTitle>Success alert</AlertTitle>
          <AlertDescription>Generic feedback only.</AlertDescription>
        </Alert>
        <Alert variant="warning">
          <Bell />
          <AlertTitle>Warning alert</AlertTitle>
          <AlertDescription>Generic feedback only.</AlertDescription>
        </Alert>
      </div>

      <div className="grid gap-3">
        <Skeleton className="h-5 w-40" />
        <Progress value={42} aria-label="Example progress" />
      </div>

      <DomainStatusBadgeValidationSurface />

      <DSPatternValidationSurface />
    </section>
  );
}
