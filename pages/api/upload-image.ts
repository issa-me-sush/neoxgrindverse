import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import dbConnect from '../../utils/dbConnect';
import Image from '../../models/Image';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];
    const placeId = fields.placeId?.[0];
    const userAddress = fields.userAddress?.[0];

    if (!file || !placeId || !userAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prepare form data for Pinata
    const formData = new FormData();
    
    // Read file and create File object
    const fileData = await fs.promises.readFile(file.filepath);
    const blob = new Blob([fileData], { type: file.mimetype || 'image/jpeg' });
    const uploadFile = new File([blob], file.originalFilename || 'image.jpg');
    formData.append('file', uploadFile);

    // Add metadata
    const metadata = JSON.stringify({
      name: `${placeId}-${Date.now()}`,
      keyvalues: {
        placeId,
        userAddress,
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Add pinata options
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    // Upload to Pinata
    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      },
      body: formData
    });

    if (!pinataRes.ok) {
      throw new Error(`Pinata upload failed: ${pinataRes.statusText}`);
    }

    const result = await pinataRes.json();
    console.log('📦 Uploaded with CID:', result.IpfsHash);

    // Clean up temp file
    await fs.promises.unlink(file.filepath);

    // Store in MongoDB
    await dbConnect();
    const imageDoc = await Image.create({
      placeId,
      userAddress,
      cid: result.IpfsHash,
      url: `https://ipfs.io/ipfs/${result.IpfsHash}`, // Use public IPFS gateway
      tokenId: null,
      votes: new Map(),
      score: 0
    });

    return res.status(200).json({
      success: true,
      ...imageDoc.toObject()
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 