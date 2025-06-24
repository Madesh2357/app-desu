import * as icons from 'lucide-react';
import { type LucideProps } from 'lucide-react';
import React from 'react';

// This is a bit of a hack to get around the fact that lucide-react doesn't
// export a type for its icon names.
type IconName = keyof typeof icons;

interface DynamicIconProps extends LucideProps {
  name: string;
}

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const LucideIcon = icons[name as IconName];

  if (!LucideIcon) {
    // Fallback icon
    return <icons.HelpCircle {...props} />;
  }

  return <LucideIcon {...props} />;
};

export default DynamicIcon;
