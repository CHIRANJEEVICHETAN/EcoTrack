interface Window {
    google: {
      translate: {
        TranslateElement: {
          new (options: any, element: string): any;
          InlineLayout: {
            SIMPLE: string;
          };
        };
      };
    };
    googleTranslateElementInit: () => void;
  }