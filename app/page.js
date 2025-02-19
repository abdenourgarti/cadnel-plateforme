'use client'
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigez l'utilisateur vers la page de login
    router.push('/Login');
  }, [router]);
}
