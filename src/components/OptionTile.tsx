import React from 'react';
import { motion } from 'framer-motion';

interface OptionTileProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const OptionTile: React.FC<OptionTileProps> = ({ title, description, icon, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="option-tile cursor-pointer p-6"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </motion.div>
  );
};

export default OptionTile;
