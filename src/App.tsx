import { useState } from 'react';
import DicePage from './screens/Dice/DicePage';
import ConfigManagerPage from './screens/ConfigManager/ConfigManagerPage';

type Page = 'dice' | 'configs';

function App() {
  const [page, setPage] = useState<Page>('dice');

  if (page === 'configs') {
    return <ConfigManagerPage onBack={() => setPage('dice')} />;
  }

  return <DicePage onNavigateToConfigs={() => setPage('configs')} />;
}

export default App;
