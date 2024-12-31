import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/dbConnect';
import Message from '../../../models/Message';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { placeId, userAddress, message } = req.body;

    if (!placeId || !userAddress || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newMessage = await Message.create({
      placeId,
      userAddress,
      message
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({ error: 'Failed to create message' });
  }
} 