router.post('/share/static', async (req, res) => {
	const { snapshotName, expiration, listType } = req.body;
	const userId = req.user.id; // Ensure the user is authenticated

	try {
	  const user = await User.findById(userId);
	  if (!user || !user[listType]) {
		return res.status(404).json({ message: 'List not found.' });
	  }

	  const animeIds = user[listType];
	  const staticLinkId = new mongoose.Types.ObjectId(); // Unique ID for the static link
	  const expirationDate = expiration === 'permanent' ? null : new Date(Date.now() + expiration * 24 * 60 * 60 * 1000); // Calculate expiration

	  const staticLink = {
		id: staticLinkId,
		type: 'static',
		listType,
		animeIds,
		createdAt: new Date(),
		expiration: expirationDate,
		snapshotName: snapshotName || `${listType} Snapshot`
	  };

	  user.sharedLinks.push(staticLink);
	  await user.save();

	  const shareLink = `/shared/static/${staticLinkId}`;
	  res.json({ shareLink });
	} catch (error) {
	  console.error('Error creating static link:', error);
	  res.status(500).json({ message: 'Error creating static link.' });
	}
  });

router.get('/shared/static/:linkId', async (req, res) => {
	const { linkId } = req.params;

	try {
	  // Find the static link
	  const user = await User.findOne({ 'sharedLinks.id': linkId });
	  const staticLink = user ? user.sharedLinks.find(link => link.id === linkId) : null;

	  if (!staticLink) {
		return res.status(404).json({ message: 'Link not found.' });
	  }

	  // Check if the link is expired
	  if (staticLink.expiration && new Date() > staticLink.expiration) {
		return res.status(410).json({ message: 'This link has expired.' });
	  }

	  // Fetch details of the anime in the static link
	  const animeDetails = await Promise.all(
		staticLink.animeIds.map(async (animeId) => {
		  const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
		  return response.data.data;
		})
	  );

	  res.render('sharedAnimeList', {
		title: staticLink.snapshotName,
		animeList: animeDetails
	  });
	} catch (error) {
	  console.error('Error fetching static link:', error);
	  res.status(500).json({ message: 'Error fetching static link.' });
	}
  });
