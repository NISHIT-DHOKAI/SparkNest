const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Board = require('../models/Board');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', protect, async (req, res) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 80);
    const tab = String(req.query.tab || 'all').toLowerCase();
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 20;

    if (!query) {
      return res.json({ users: [], posts: [], reels: [], boards: [] });
    }

    const pattern = new RegExp(escapeRegex(query), 'i');
    const include = (category) => tab === 'all' || tab === 'null' || tab === category;

    const [users, posts, reels, boards] = await Promise.all([
      include('people')
        ? User.find({
            isBanned: { $ne: true },
            'preferences.privacy.profileDiscoverable': { $ne: false },
            $or: [{ name: pattern }, { email: pattern }]
          })
            .select('name profilePic')
            .limit(limit)
            .lean()
        : [],
      include('posts')
        ? Post.find({
            isDeleted: { $ne: true },
            $or: [{ caption: pattern }, { tags: pattern }]
          })
            .populate('user', 'name profilePic')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()
        : [],
      include('reels')
        ? Reel.find({
            isDeleted: { $ne: true },
            $or: [{ title: pattern }, { caption: pattern }]
          })
            .populate('user', 'name profilePic')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()
        : [],
      include('boards')
        ? Board.find({
            $and: [
              { $or: [{ isPrivate: { $ne: true } }, { user: req.user._id }] },
              { $or: [{ name: pattern }, { description: pattern }] }
            ]
          })
            .populate('user', 'name profilePic')
            .sort({ createdAt: -1 })
            .limit(limit)
        : []
    ]);

    const userIds = users.map((user) => user._id);
    const postCounts = userIds.length
      ? await Post.aggregate([
          { $match: { user: { $in: userIds }, isDeleted: { $ne: true } } },
          { $group: { _id: '$user', count: { $sum: 1 } } }
        ])
      : [];
    const countByUserId = new Map(postCounts.map(({ _id, count }) => [_id.toString(), count]));

    res.json({
      users: users.map((user) => ({
        ...user,
        postCount: countByUserId.get(user._id.toString()) || 0
      })),
      posts,
      reels,
      boards
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

module.exports = router;
