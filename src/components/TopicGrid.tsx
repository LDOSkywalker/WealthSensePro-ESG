// ⚠️ COMPOSANT NON UTILISÉ POUR L'INSTANT
// Ce composant est prévu pour organiser la navigation par sujets de conversation
// mais n'est pas encore intégré dans l'interface principale de l'application
//
import React from 'react';
import TopicButton from './TopicButton';
import { Topic } from '../types';

interface TopicGridProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
}

const TopicGrid: React.FC<TopicGridProps> = ({ topics, onSelectTopic }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {topics.map(topic => (
        <TopicButton 
          key={topic.id} 
          topic={topic} 
          onClick={onSelectTopic} 
        />
      ))}
    </div>
  );
};

export default TopicGrid;