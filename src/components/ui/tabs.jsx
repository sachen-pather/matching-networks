"use client";

import * as React from "react";

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-700 p-1 text-gray-400 ${className}`}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium ring-offset-gray-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-900 data-[state=active]:text-blue-100 data-[state=active]:shadow-sm ${className}`}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  // We add complete 'hidden' attribute, not just a class, for better hiding
  return <div ref={ref} className={`mt-2 ${className}`} {...props} />;
});
TabsContent.displayName = "TabsContent";

const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}) => {
  const [localValue, setLocalValue] = React.useState(defaultValue);

  // Use the provided value prop if available, otherwise use local state
  const activeValue = value !== undefined ? value : localValue;

  // Clone children to add necessary props
  const clonedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    if (child.type.displayName === "TabsList") {
      // Process TabsList children to add click handlers
      const tabsListChildren = React.Children.map(
        child.props.children,
        (tabChild) => {
          if (
            !React.isValidElement(tabChild) ||
            tabChild.type.displayName !== "TabsTrigger"
          )
            return tabChild;

          return React.cloneElement(tabChild, {
            onClick: () => {
              if (onValueChange) {
                onValueChange(tabChild.props.value);
              } else {
                setLocalValue(tabChild.props.value);
              }
            },
            "data-state":
              tabChild.props.value === activeValue ? "active" : "inactive",
            "aria-selected": tabChild.props.value === activeValue,
          });
        }
      );

      return React.cloneElement(child, {}, tabsListChildren);
    }

    if (child.type.displayName === "TabsContent") {
      // Set visibility state for content and use style for better hiding
      return React.cloneElement(child, {
        "data-state": child.props.value === activeValue ? "active" : "inactive",
        hidden: child.props.value !== activeValue,
        style: {
          display: child.props.value === activeValue ? "block" : "none",
        },
      });
    }

    return child;
  });

  return (
    <div className={className} {...props}>
      {clonedChildren}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
