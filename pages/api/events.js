import dbConnect from '../../utils/dbConnect';
import Event from '../../models/Event';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../../contracts/abi';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { placeId } = req.query;
      const events = await Event.find({ placeId }).sort({ date: 1 });
      res.status(200).json(events);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  else if (req.method === 'POST') {
    try {
      const event = await Event.create(req.body);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
} 