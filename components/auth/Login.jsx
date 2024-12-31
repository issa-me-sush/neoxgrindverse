"use client";
import { useAuthModal, useUser, useSignerStatus } from "@account-kit/react";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export function LoginButton() {
  const { openAuthModal } = useAuthModal();
  const user  = useUser();
  const { isInitializing } = useSignerStatus();
  const router = useRouter();
  
  // Handle auto-open login modal
  useEffect(() => {
    if (!isInitializing && !user && router.isReady) {
      const shouldOpenLogin = router.query.open === 'true';
      if (shouldOpenLogin) {
        openAuthModal();
      }
    }
  }, [isInitializing, router.isReady]);

  // Handle successful authentication
  useEffect(() => {
    const handleAuth = async () => {
      const uid = router.query.uid;
      if (user?.address && uid) {
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: user.address,
              uid,
            }),
          });

          const data = await response.json();
          console.log('User registered:', data);
          router.push(`/home`);
        } catch (error) {
          console.error('Failed to register user:', error);
        }
      }
    };

    handleAuth();
  }, [user]); 

  if (isInitializing) {
    return <div className="loading">Loading...</div> ;
  }

  if (user) {
    return (
      <Link href='/home'>
        <div className='bg-white text-black px-4 py-2 rounded-full' role="button">
          Dashboard
        </div>
      </Link>
    );
  }

  return (
    <button
      onClick={openAuthModal}
      className='bg-white text-black px-4 py-2 rounded-full'
    >
      Login
    </button>
  );
}