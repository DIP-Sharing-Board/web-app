import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Category from '../components/Category';
import styles from '../styles/Board.module.css';

const Board = () => {
  const [activities, setActivities] = useState({
    camp: [],
    competition: [],
    other: [],
  });
  const [currentIndices, setCurrentIndices] = useState({
    camp: 0,
    competition: 0,
    other: 0,
  });
  const [updatedAt, setUpdatedAt] = useState({
    camp: null,
    competition: null,
    other: null,
  });
  const [error, setError] = useState(null);

  const fetchActivities = async (type, lastUpdatedAt) => {
    try {
      const url = lastUpdatedAt 
        ? `http://localhost:5000/api/v1/activities?type=${type}&updatedAt=${lastUpdatedAt}`
        : `http://localhost:5000/api/v1/activities?type=${type}`;
      console.log(`Fetching activities for: ${type} from ${url}`);
      const response = await axios.get(url);
      console.log(`Data for ${type}:`, response.data);
      return response.data;
    } catch (err) {
      console.error(`Failed to fetch ${type} activities: ${err.message}`);
      throw err;
    }
  };

  useEffect(() => {
    const fetchAllActivities = async () => {
      try {
        const [campData, competitionData, otherData] = await Promise.all([
          fetchActivities('camp', updatedAt.camp),
          fetchActivities('competition', updatedAt.competition),
          fetchActivities('other', updatedAt.other),
        ]);

        console.log('Fetched Data:', { campData, competitionData, otherData });

        // Limit each category to the 20 latest entries and filter out activities without imageUrls
        setActivities({
          camp: (campData.data || []).filter(activity => activity.imageUrl).slice(-20),
          competition: (competitionData.data || []).filter(activity => activity.imageUrl).slice(-20),
          other: (otherData.data || []).filter(activity => activity.imageUrl).slice(-20),
        });

        setUpdatedAt({
          camp: campData.updatedAt,
          competition: competitionData.updatedAt,
          other: otherData.updatedAt,
        });
      } catch (err) {
        console.error('Error fetching all activities:', err);
        setError(err.message);
      }
    };

    const fetchInterval = setInterval(fetchAllActivities, 1800000); // Fetch data every 30 minutes

    return () => clearInterval(fetchInterval);
  }, [updatedAt]);

  useEffect(() => {
    const switchInterval = setInterval(() => {
      setCurrentIndices((prevIndices) => ({
        camp: activities.camp.length > 0 ? (prevIndices.camp + 1) % activities.camp.length : 0,
        competition: activities.competition.length > 0 ? (prevIndices.competition + 1) % activities.competition.length : 0,
        other: activities.other.length > 0 ? (prevIndices.other + 1) % activities.other.length : 0,
      }));
    }, 25000); // Switch every 25 seconds

    return () => clearInterval(switchInterval);
  }, [activities]);

  return (
    <div className={styles.board}>
      {error && <p>Error: {error}</p>}
      {['camp', 'competition', 'other'].map((category) => (
        <div key={category}>
          <Category
            title={category.charAt(0).toUpperCase() + category.slice(1)}
            activities={activities[category] || []} // Ensure activities is always an array
            currentIndex={currentIndices[category]} // Pass the current index for switching
          />
        </div>
      ))}
    </div>
  );
};

export default Board;
