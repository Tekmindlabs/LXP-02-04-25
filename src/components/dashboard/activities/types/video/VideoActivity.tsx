'use client';

import React from 'react';
import { VideoConfig } from '@/types/class-activity';
import { Card, CardContent } from '@/components/ui/card';

interface VideoActivityProps {
	config: VideoConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: any) => void;
}

export function VideoActivity({ config, viewType }: VideoActivityProps) {
	const getYouTubeVideoId = (url: string) => {
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? match[2] : null;
	};

	const videoId = getYouTubeVideoId(config.videoUrl);

	if (!videoId) {
		return (
			<Card>
				<CardContent className="p-4">
					<div className="text-red-500">Invalid YouTube URL</div>
				</CardContent>
			</Card>
		);
	}

	const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${
		config.autoplay ? '&autoplay=1' : ''
	}${config.showControls ? '' : '&controls=0'}`;

	return (
		<Card>
			<CardContent className="p-4">
				<div className="aspect-video w-full">
					<iframe
						width="100%"
						height="100%"
						src={embedUrl}
						title="YouTube video player"
						frameBorder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					></iframe>
				</div>
			</CardContent>
		</Card>
	);
}