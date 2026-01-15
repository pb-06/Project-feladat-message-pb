//import { useState } from 'react';
import { RedirectToSignIn, SignedIn, UserButton } from '@neondatabase/neon-js/auth/react/ui';

export function Home() {
  const handlePostButtonClick = async (e: any) => {
    e.preventDefault();

    const resJson = await fetch('/api/messages', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await resJson.text();  // Get raw text to inspect
    console.log('Response Text:', text);

    try {
      const resObj = JSON.parse(text);  // Manually parse the text if it's valid JSON
      console.log('Parsed Response:', resObj);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  };

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