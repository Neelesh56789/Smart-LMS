// @desc    Get latest tech news
// @route   GET /api/news
// @access  Public
exports.getLatestNews = async (req, res) => {
  try {
    // This would typically connect to a news API or database
    // For demo purposes, we'll return static data
    const news = [
      {
        id: 1,
        title: 'The Future of AI in Education',
        summary: 'How artificial intelligence is transforming online learning platforms and creating personalized educational experiences.',
        image: 'ai-education.jpg',
        date: '2025-07-01',
        url: 'https://example.com/ai-education'
      },
      {
        id: 2,
        title: 'Web Development Trends for 2025',
        summary: 'The latest frameworks, tools, and methodologies shaping the web development landscape this year.',
        image: 'web-dev-trends.jpg',
        date: '2025-06-28',
        url: 'https://example.com/web-dev-trends'
      },
      {
        id: 3,
        title: 'Blockchain Revolution in Online Certifications',
        summary: 'How blockchain technology is making online course certifications more secure and verifiable.',
        image: 'blockchain-certs.jpg',
        date: '2025-06-25',
        url: 'https://example.com/blockchain-certs'
      },
      {
        id: 4,
        title: 'Virtual Reality Classrooms: The Next Big Thing?',
        summary: 'Exploring the potential of VR technology to create immersive learning environments.',
        image: 'vr-classrooms.jpg',
        date: '2025-06-22',
        url: 'https://example.com/vr-classrooms'
      },
      {
        id: 5,
        title: 'The Rise of Micro-Learning Platforms',
        summary: 'How bite-sized learning modules are changing the way professionals upskill in 2025.',
        image: 'micro-learning.jpg',
        date: '2025-06-20',
        url: 'https://example.com/micro-learning'
      }
    ];

    res.status(200).json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
