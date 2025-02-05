'use client';

import { ReactNode } from 'react';

interface ActivityTemplateGridProps {
	children: ReactNode;
}

export function ActivityTemplateGrid({ children }: ActivityTemplateGridProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{children}
		</div>
	);
}
