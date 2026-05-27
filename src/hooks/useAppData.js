import { useState, useEffect } from 'react';
import { detectBackendPort, fetchWithCache } from '../utils/api';

export function useAppData() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [items, setItems] = useState({});
  const [heroList, setHeroList] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Detect backend port first
      await detectBackendPort();

      // Fetch all data in parallel
      const [hero, trending, recommended, movies, tv, anime] = await Promise.all([
        fetchWithCache('/hero'),
        fetchWithCache('/trending?type=all'),
        fetchWithCache('/recommended'),
        fetchWithCache('/movies'),
        fetchWithCache('/tv'),
        fetchWithCache('/anime')
      ]);

      // Build items map
      const itemsMap = {};
      const addItems = (list) => list.forEach(item => itemsMap[item.id] = item);

      addItems(hero);
      addItems(trending);
      addItems(recommended);
      addItems(movies);
      addItems(tv);
      addItems(anime);

      setItems(itemsMap);
      setHeroList(hero.map(item => item.id));

      // Build rows
      setRows([
        { id: 'cont', label: 'Continue Watching', kind: 'continue', items: trending.slice(0, 8).map(item => item.id) },
        { id: 'tr', label: 'Trending Now', kind: 'poster', items: trending.map(item => item.id) },
        { id: 'rec', label: 'Recommended For You', kind: 'poster', items: recommended.map(item => item.id) },
        { id: 'mv', label: 'Popular Movies', kind: 'poster', items: movies.map(item => item.id) },
        { id: 'tv', label: 'Popular TV Shows', kind: 'poster', items: tv.map(item => item.id) },
        { id: 'an', label: 'Popular Anime', kind: 'poster', items: anime.map(item => item.id) }
      ]);

      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load app data:', error);
    }
  }

  return { dataLoaded, items, heroList, rows };
}
