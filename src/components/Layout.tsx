import { NavLink, Outlet } from 'react-router-dom';
import { IconArrowBackUp, IconLayoutDashboard, IconMenu2, IconPackage, IconReceipt, IconSettings, IconPlayerPlay, IconCode, IconTrash, IconChevronDown, IconFile, IconFileTypePdf, IconPhoto, IconDownload } from '@tabler/icons-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import ChatWidget from '@/components/ChatWidget';
import { ActionInputDialog } from '@/components/ActionInputDialog';
import { TopBar } from '@/components/TopBar';
import { useActions } from '@/context/ActionsContext';

const APP_TITLE = 'Rechnungsverwaltung';

const IS_EMBED = new URLSearchParams(window.location.search).has('embed') || window.navigator.userAgent.startsWith('LivingAppsMobile');

const navigation = [
  { name: 'Übersicht', href: '/', icon: IconLayoutDashboard },
  { name: 'Rechnungen', href: '/rechnungen', icon: IconReceipt },
  { name: 'Rechnungspositionen', href: '/rechnungspositionen', icon: IconReceipt },
  { name: 'Artikelkatalog', href: '/artikelkatalog', icon: IconPackage },
];

const externalNavigation = [
  { name: 'Rechnungen', href: '/gateway/apps/69b89166574efe552fa528fa?template=list_page', icon: IconReceipt },
  { name: 'Rechnungspositionen', href: '/gateway/apps/69b8916778e07ae8842ea5b9?template=list_page', icon: IconReceipt },
  { name: 'Artikelkatalog', href: '/gateway/apps/69b8916378e0e1c2eef5283c?template=list_page', icon: IconPackage },
];

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') return <IconFileTypePdf size={14} className="shrink-0 text-red-500" />;
  if (mimeType.startsWith('image/')) return <IconPhoto size={14} className="shrink-0 text-blue-500" />;
  return <IconFile size={14} className="shrink-0 text-muted-foreground" />;
}

type FileSortMode = 'newest' | 'oldest' | 'az' | 'za';
const FILE_SORT_LABELS: Record<FileSortMode, string> = {
  newest: 'Neuste zuerst',
  oldest: 'Älteste zuerst',
  az: 'Name A→Z',
  za: 'Name Z→A',
};

function ActionsBar() {
  const { actions, runAction, showActionCode, deleteAction, devMode, files, downloadFile } = useActions();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [fileSort, setFileSort] = useState<FileSortMode>('newest');
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      switch (fileSort) {
        case 'newest': return b.created_at.localeCompare(a.created_at);
        case 'oldest': return a.created_at.localeCompare(b.created_at);
        case 'az': return a.filename.localeCompare(b.filename);
        case 'za': return b.filename.localeCompare(a.filename);
      }
    });
  }, [files, fileSort]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setExpandedAction(null);
        setFilesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (actions.length === 0 && files.length === 0) return null;

  return (
    <div ref={barRef} className="relative z-10 flex justify-end mb-3">
      {/* Desktop: show all action buttons + files */}
      <div className="hidden lg:flex flex-wrap gap-2 justify-end">
        {files.length > 0 && (
          <div className="relative">
            <button
              onClick={() => { setFilesOpen(!filesOpen); setExpandedAction(null); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filesOpen ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              <IconFile size={14} />
              Dateien ({files.length})
            </button>
            {filesOpen && (
              <div className="absolute top-full right-0 mt-1 z-30 bg-card border border-border rounded-xl shadow-lg min-w-64 max-w-80">
                <div className="flex flex-wrap gap-1 px-3 pt-3 pb-2">
                  {(['newest', 'oldest', 'az', 'za'] as FileSortMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setFileSort(mode)}
                      className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                        fileSort === mode ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {FILE_SORT_LABELS[mode]}
                    </button>
                  ))}
                </div>
                <div className="max-h-72 overflow-y-auto p-1.5 pt-0">
                  {sortedFiles.map(f => (
                    <button
                      key={f.identifier}
                      onClick={() => { void downloadFile(f.url, f.filename); setFilesOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-accent text-left transition-colors"
                    >
                      <FileIcon mimeType={f.mime_type} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{f.filename}</div>
                        <div className="text-xs text-muted-foreground truncate">{f.app_name}</div>
                      </div>
                      <IconDownload size={14} className="shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {actions.map(a => {
          const key = `${a.app_id}/${a.identifier}`;
          const isExpanded = expandedAction === key;
          return (
            <div key={key} className="relative">
              <button
                onClick={() => setExpandedAction(isExpanded ? null : key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  isExpanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                <IconPlayerPlay size={14} />
                {a.title || a.identifier}
              </button>
              {isExpanded && (
                <div className="absolute top-full left-0 mt-1 z-30 bg-card border border-border rounded-xl shadow-lg p-3 min-w-48">
                  <div className="text-sm font-medium text-foreground mb-0.5">{a.title || a.identifier}</div>
                  {devMode && <div className="text-xs text-muted-foreground font-mono mb-0.5">{a.identifier}</div>}
                  {a.description && <div className="text-xs text-muted-foreground mb-2">{a.description}</div>}
                  <div className="flex gap-1">
                    <button
                      onClick={() => { runAction(a); setExpandedAction(null); }}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Ausführen"
                    >
                      <IconPlayerPlay size={16} />
                    </button>
                    {devMode && (
                      <button
                        onClick={() => { showActionCode(a); setExpandedAction(null); }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        title="Quellcode"
                      >
                        <IconCode size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => { void deleteAction(a); setExpandedAction(null); }}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      title="Löschen"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Mobile: combined dropdown for actions + files */}
      <div className="lg:hidden flex gap-2 relative">
        {files.length > 0 && (
          <button
            onClick={() => { setFilesOpen(!filesOpen); setDropdownOpen(false); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <IconFile size={14} />
            {files.length}
          </button>
        )}
        {actions.length > 0 && (
          <button
            onClick={() => { setDropdownOpen(o => !o); setFilesOpen(false); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Aktionen ({actions.length})
            <IconChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-[60] bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-52 max-w-[calc(100vw-2rem)]">
              {actions.map(a => (
                <div
                  key={`${a.app_id}/${a.identifier}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{a.title || a.identifier}</div>
                    {devMode && <div className="text-xs text-muted-foreground font-mono truncate">{a.identifier}</div>}
                    {a.description && <div className="text-xs text-muted-foreground truncate">{a.description}</div>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { runAction(a); setDropdownOpen(false); }}
                      className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                    >
                      <IconPlayerPlay size={14} />
                    </button>
                    {devMode && (
                      <button
                        onClick={() => { showActionCode(a); setDropdownOpen(false); }}
                        className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      >
                        <IconCode size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => { void deleteAction(a); setDropdownOpen(false); }}
                      className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {filesOpen && (
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setFilesOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-[60] bg-card border border-border rounded-xl shadow-lg min-w-52 max-w-[calc(100vw-2rem)]">
              <div className="flex flex-wrap gap-1 px-3 pt-3 pb-2">
                {(['newest', 'oldest', 'az', 'za'] as FileSortMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFileSort(mode)}
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                      fileSort === mode ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {FILE_SORT_LABELS[mode]}
                  </button>
                ))}
              </div>
              <div className="max-h-72 overflow-y-auto p-1.5 pt-0">
                {sortedFiles.map(f => (
                  <button
                    key={f.identifier}
                    onClick={() => { void downloadFile(f.url, f.filename); setFilesOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-accent text-left text-sm transition-colors"
                  >
                    <FileIcon mimeType={f.mime_type} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{f.filename}</div>
                      <div className="text-xs text-muted-foreground truncate">{f.app_name}</div>
                    </div>
                    <IconDownload size={14} className="shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { inputFormAction, inputFormOptions, submitActionInputs, cancelInputForm } = useActions();
  useEffect(() => { document.title = APP_TITLE; }, []);

  return (
    <div className="min-h-screen bg-background">
      {!IS_EMBED && (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm" style={{ height: 'var(--topbar-h)' }}>
        <div className="flex items-center justify-between h-full px-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <IconMenu2 size={18} />
            </button>
            <svg className="hidden lg:block w-9 h-9 shrink-0" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.6162 33.9164L20.4429 36.4084C20.4429 36.4084 13.4064 39.5929 9.85984 41.6434C7.73514 42.8719 6.93751 43.762 7.68335 44.356C8.00045 44.6086 18.7719 52.7814 19.1375 53.0247C23.2398 55.7549 15.79 45.2036 15.79 45.2036C15.79 45.2036 26.3397 41.899 28.5944 39.281C30.8491 36.6629 28.9112 33.9164 28.9112 33.9164C28.9112 33.9164 33.0253 35.5016 33.1876 39.281C33.289 41.6444 30.466 46.5779 28.9632 50.3787C28.063 52.6557 27.6349 53.4537 28.5898 53.4582C28.9958 53.4601 43.3581 53.5103 43.7947 53.4582C46.5726 53.1267 36.1923 50.3787 36.1923 50.3787C36.1923 50.3787 40.934 43.8566 42.0571 39.7543C42.7914 37.072 40.4732 33.4431 40.4732 33.4431C40.4732 33.4431 50.6098 36.1253 51.4017 35.4942C52.1937 34.8631 49.026 26.6585 49.026 26.6585C49.026 26.6585 57 22.8756 57 21.4556C57 20.0356 49.171 16.4028 49.171 16.4028C49.171 16.4028 49.8179 9.14493 48.3924 8.35603C46.967 7.56713 36.672 11.996 36.672 11.996C36.672 11.996 31.7464 3.51825 28.8955 3.51825C26.0446 3.51825 20.5168 11.996 20.5168 11.996C20.5168 11.996 11.3306 7.25157 10.0635 7.88269C8.79641 8.51381 8.47964 16.4028 8.47964 16.4028C8.47964 16.4028 0 20.1818 0 21.6019C0 23.0219 8.9548 26.6585 8.9548 26.6585C8.9548 26.6585 6.10388 35.0209 7.21257 35.4942C8.32126 35.9676 18.6162 33.9164 18.6162 33.9164Z" fill="#FF5C00"/>
              <path d="M39.2754 22.6432C39.2754 24.6087 35.038 28.5398 28.6918 28.5398C22.3457 28.5398 18.1083 24.7599 18.1083 22.6432C18.1083 20.5265 22.3457 16.2931 28.6918 16.2931C35.038 16.2931 39.2754 20.6777 39.2754 22.6432Z" fill="white"/>
              <path d="M31.4755 16.5827C32.7516 16.8524 33.9029 17.2929 34.9052 17.8249C36.2586 18.8904 37.1287 20.5421 37.1288 22.3981C37.1288 24.6151 35.8885 26.5416 34.0643 27.5241C33.4073 27.7869 32.6982 28.0121 31.9413 28.1823C31.7334 28.2048 31.5223 28.2174 31.3085 28.2174C28.0946 28.2172 25.4891 25.612 25.4891 22.3981C25.4892 21.683 25.6183 20.9978 25.8544 20.3649C26.2591 20.989 26.9614 21.4029 27.7606 21.403C29.0148 21.4028 30.0311 20.3857 30.0311 19.1315C30.0311 18.2656 29.5467 17.5126 28.8339 17.1295C29.5848 16.7762 30.4236 16.5788 31.3085 16.5788C31.3643 16.5788 31.42 16.5811 31.4755 16.5827Z" fill="black"/>
            </svg>
            <span className="font-semibold text-sm truncate">{APP_TITLE}</span>
          </div>
          <TopBar />
        </div>
      </header>
      )}

      {!IS_EMBED && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          style={{ top: 'var(--topbar-h)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {!IS_EMBED && (
      <aside
        className={`
          fixed left-0 z-40 w-72 bg-sidebar border-r border-sidebar-border overflow-hidden
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{ top: 'var(--topbar-h)', height: 'calc(100vh - var(--topbar-h))' }}
      >
        <div className="flex flex-col h-full">
        <nav className="px-3 pt-4 space-y-0.5">
          <a
            href="/gateway/apps/69b89166574efe552fa528fa?template=list_page"
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-base transition-colors min-w-0 text-sidebar-foreground font-normal hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <IconArrowBackUp size={16} className="shrink-0" />
            <span className="truncate">Zurück</span>
          </a>
          <p className="px-4 pb-2 pt-2 text-xs font-medium text-muted-foreground">
            Navigation
          </p>
          {/* Overview link */}
          {navigation.slice(0, 1).map(item => {
            const Icon = item.icon;
            return (
            <NavLink
              key={item.href}
              to={item.href}
              end
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-2 px-4 py-2 rounded-2xl text-base transition-colors min-w-0 ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground font-normal hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
            );
          })}
          {/* Entity links (external) */}
          {externalNavigation.map(item => {
            const Icon = item.icon;
            return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-base transition-colors min-w-0 text-sidebar-foreground font-normal hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{item.name}</span>
            </a>
            );
          })}
          {/* CRUD page links (hidden via .nav-crud-item { display: none } in index.css) */}
          {navigation.slice(1).map(item => {
            const Icon = item.icon;
            return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                `nav-crud-item flex items-center gap-2 px-4 py-2 rounded-2xl text-base transition-colors min-w-0 ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground font-normal hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pb-4">
          <div className="border-t border-sidebar-border pt-3">
            <NavLink
              to='/admin'
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-2 px-4 py-2 rounded-2xl text-base transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/60 font-normal hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <IconSettings size={16} className="shrink-0" />
              <span className="truncate">Verwaltung</span>
            </NavLink>
          </div>
        </div>
        </div>
      </aside>
      )}

      <div className={IS_EMBED ? "" : "lg:pl-72"} style={IS_EMBED ? undefined : { paddingTop: 'var(--topbar-h)' }}>
        <main className={`max-w-screen-2xl ${IS_EMBED ? "p-2 lg:p-4" : "p-6 lg:p-8"}`}>
          {!IS_EMBED && <ActionsBar />}
          <Outlet />
        </main>
      </div>

      {!IS_EMBED && <ChatWidget />}

      {inputFormAction && inputFormAction.metadata?.input_schema && (
        <ActionInputDialog
          action={inputFormAction}
          schema={inputFormAction.metadata.input_schema}
          options={inputFormOptions}
          onSubmit={(inputs, files) => submitActionInputs(inputFormAction, inputs, files)}
          onCancel={cancelInputForm}
        />
      )}
    </div>
  );
}
