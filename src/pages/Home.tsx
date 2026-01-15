//import { useState } from 'react';
import { RedirectToSignIn, SignedIn, UserButton } from '@neondatabase/neon-js/auth/react/ui';

export function Home() {
   const handlePostButtonClick = async (e: any) => {
    e.preventDefault();

    const resJson = await fetch('/api/messages', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      //body: JSON.stringify({ id: id })
    });

    console.log('resJson', resJson);
    const resObj = await resJson.json();
    console.log('resObj', resObj);
  }

  return (
    <>
      <SignedIn>
        <div className='flex flex-col justify-center items-center min-h-screen gap-8'>
          <div className='text-center'>
            <h1>Welcome!</h1>
            <p>You're successfully authenticated.</p>
            <UserButton />

            <button onClick={handlePostButtonClick}>
            Test
            </button>

          </div>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}