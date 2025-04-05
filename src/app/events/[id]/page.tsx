'use client';

import { redirect } from 'next/navigation';

interface EventPageProps {
  params: {
    id: string;
  };
}

export default function EventPage({ params }: EventPageProps) {
  redirect(`/daos/${params.id}`);
  return null;
} 