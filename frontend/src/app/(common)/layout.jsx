import Navbar from '@/components/shared/Navbar';
import React from 'react';

const mainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
    </>
  );
};

export default mainLayout;