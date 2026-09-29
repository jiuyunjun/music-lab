import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './features/shell/Layout';
import { ComingSoon } from './features/shell/ComingSoon';
import { HomePage } from './features/home/HomePage';
import { ChordsPage } from './features/chords/ChordsPage';
import { DrumsPage } from './features/instruments/DrumsPage';
import { GuitarPage } from './features/instruments/GuitarPage';
import { PlayPage } from './features/instruments/PlayPage';
import { ScaleLabPage } from './features/scales/ScaleLabPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="play" element={<PlayPage />} />
          <Route path="play/guitar" element={<GuitarPage />} />
          <Route path="play/drums" element={<DrumsPage />} />
          <Route path="scales" element={<ScaleLabPage />} />
          <Route path="chords" element={<ChordsPage />} />
          <Route path="arrange" element={<ComingSoon />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
