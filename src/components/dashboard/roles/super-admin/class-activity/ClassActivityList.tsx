'use client';

import { useState } from 'react';
import { api } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { UnifiedClassActivity } from './types';

interface ClassActivityListProps {
	onEdit: (id: string) => void;
}

export function ClassActivityList({ onEdit }: ClassActivityListProps) {
	const [selectedType, setSelectedType] = useState<string | null>(null);
	
	const { data: activities, isLoading } = api.classActivity.getAll.useQuery({
		type: selectedType as any,
	});

	const utils = api.useContext();
	const deleteActivity = api.classActivity.delete.useMutation({
		onSuccess: () => {
			utils.classActivity.getAll.invalidate();
		},
	});

	if (isLoading) {
		return <div>Loading activities...</div>;
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{activities?.map((activity) => (
					<Card key={activity.id}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{activity.title}
							</CardTitle>
							<div className="flex space-x-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onEdit(activity.id)}
								>
									<Edit2 className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => deleteActivity.mutate(activity.id)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								{activity.description}
							</p>
							<div className="mt-2 flex items-center justify-between text-sm">
								<span className="font-medium">{activity.type}</span>
								<span className="text-muted-foreground">
									{activity.status}
								</span>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

