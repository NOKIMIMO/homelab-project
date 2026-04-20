import { useState, type FormEvent} from "react";
import { apiUrl } from "../../lib/api";
import BoardEditor from "../../components/images/boards/BoardEditor";
import BoardList from "../../components/images/boards/BoardList";
import CreateBoardModal from "../../components/images/modals/CreateBoardModal";
import { useNavigate } from "react-router";
import { Camera, Layout, Plus } from "lucide-react";
import { ViewToggleButton, SortButton } from "../../components/ui/Controls";
import styles from "../../lib/style";

type SortOrder = 'asc' | 'desc';

const MoodBoardDisplayer = () => {

    const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    
    const handleCreateBoard = async (e: FormEvent) => {
        e.preventDefault();
        if (!newBoardName) return;

        const boardId = crypto.randomUUID();

        try {
        const res = await fetch(apiUrl(`/api/boards/${boardId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            name: newBoardName,
            width: 1920,
            height: 1080
            })
        });
        if (res.ok) {
            setShowCreateModal(false);
            setNewBoardName('');
            setEditingBoardId(boardId);
            // setView('boards');
            // navigate to the board editor for the new board
        }
        } catch (err) {
        console.error(err);
        }
    };



    return (
        <div className="min-h-screen bg-base-300 text-base-content font-sans pb-20 selection:bg-primary selection:text-white">
        <div className="max-w-7xl mx-auto p-4 md:p-10">
            <header className={styles.navShell}>
                <div className={styles.navGlow}></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-primary/20 p-4 rounded-3xl shadow-inner ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
                        <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">ImageDisplay</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <ViewToggleButton active={false} onClick={() => navigate("/")}>
                                <Layout size={14} /> Galerie
                            </ViewToggleButton>
                            <ViewToggleButton active={true} onClick={() => navigate("/boards")}>
                                <Layout size={14} /> Board
                            </ViewToggleButton>
                        </div>
                    </div>
                </div>
            </header>
            {/* Content */}
            <div>
                <div className="flex items-center justify-center h-full">
                    <BoardList
                        onSelectBoard={setEditingBoardId}
                        onCreateBoard={() => setShowCreateModal(true)}
                    />

                    {editingBoardId && (
                        <BoardEditor boardId={editingBoardId} onClose={() => setEditingBoardId(null)} />
                    )}

                    <CreateBoardModal
                        open={showCreateModal}
                        boardName={newBoardName}
                        onBoardNameChange={setNewBoardName}
                        onClose={() => setShowCreateModal(false)}
                        onSubmit={handleCreateBoard}
                    />
                </div>
            </div>
        </div>
    </div>
    );
}

export default MoodBoardDisplayer;