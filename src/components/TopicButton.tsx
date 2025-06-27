import React from 'react';
import { Topic } from '../types';
import * as LucideIcons from 'lucide-react';

interface TopicButtonProps {
  topic: Topic;
  onClick: (topic: Topic) => void;
}

const TopicButton: React.FC<TopicButtonProps> = ({ topic, onClick }) => {
  // Dynamically get the icon component
  const IconComponent = (LucideIcons as any)[topic.icon] || LucideIcons.HelpCircle;

  return (
    <button
      onClick={() => onClick(topic)}
      className="flex items-center p-4 bg-dark-lighter rounded-lg hover:bg-gray-800 transition-colors w-full"
    >
      <div className="mr-3 text-primary">
        <IconComponent size={24} />
      </div>
      <span className="text-left">{topic.title}</span>
    </button>
  );
};

export default TopicButton;