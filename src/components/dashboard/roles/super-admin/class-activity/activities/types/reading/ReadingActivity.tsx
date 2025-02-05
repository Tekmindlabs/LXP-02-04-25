'use client';

import React from 'react';
import { ReadingConfig } from '@/types/class-activity';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReadingActivityProps {
	config: ReadingConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
}

export function ReadingActivity({ config, viewType }: ReadingActivityProps) {
	return (
		<Card className="w-full">
			<CardContent className="p-6">
				<ScrollArea className="h-[60vh]">
					<div className="prose max-w-none">
						<div 
							dangerouslySetInnerHTML={{ __html: config.content }}
							className="mb-8"
						/>

						{config.showExamples && config.examples.length > 0 && (
							<div className="mt-8">
								<h3 className="text-xl font-semibold mb-4">Examples</h3>
								<div className="space-y-4">
									{config.examples.map((example, index) => (
										<div 
											key={index}
											className="p-4 bg-muted rounded-lg"
										>
											<div dangerouslySetInnerHTML={{ __html: example }} />
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}