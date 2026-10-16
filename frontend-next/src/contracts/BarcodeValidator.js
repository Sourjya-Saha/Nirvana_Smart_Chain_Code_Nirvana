import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const BarcodeValidator = () => {
  const [productId, setProductId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setProductId(e.target.value);
  };

  const handleCheckValidity = async () => {
    try {
      setError('');
      setMessage('');

      if (!productId) {
        setError('Please enter a valid product ID.');
        return;
      }

      const response = await axios.post(`${API_BASE}/scan_and_compare`, {
        product_id: productId
      });

      if (response.status === 200) {
        setMessage(response.data.message);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Error while checking barcode validity , Malpractice detected');
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Barcode Validator</h1>
      <input 
        type="text" 
        placeholder="Enter Product ID" 
        value={productId} 
        onChange={handleInputChange} 
      />
      <button onClick={handleCheckValidity}>Check Validity</button>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default BarcodeValidator;
