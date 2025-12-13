import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { fetcher } from '../lib/api';
import { PageHeader } from '../components/ui/layout';
import { Button } from '../components/ui/buttons';
import { Alert } from '../components/ui/feedback';
import { CARD_VARIANTS, BORDERS } from '../constants/styles';
import type { UserAdmin } from '../types';

/**
 * Admin Panel for managing demo access.
 * Only accessible to superusers.
 */
export function AdminPanel() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Grant form state
    const [grantEmail, setGrantEmail] = useState('');
    const [grantDays, setGrantDays] = useState(30);
    const [grantNotes, setGrantNotes] = useState('');
    const [isGranting, setIsGranting] = useState(false);

    // Check if user is superuser
    useEffect(() => {
        if (user && !user.is_superuser) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await fetcher<UserAdmin[]>('/api/admin/users');
                setUsers(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
            } finally {
                setLoading(false);
            }
        };

        if (user?.is_superuser) {
            fetchUsers();
        }
    }, [user]);

    const handleGrantAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGranting(true);
        setError(null);
        setSuccess(null);

        try {
            await fetcher('/api/admin/demo-access', {
                method: 'POST',
                body: JSON.stringify({
                    email: grantEmail,
                    duration_days: grantDays,
                    notes: grantNotes || null,
                }),
            });

            setSuccess(`Accès demo accordé à ${grantEmail} pour ${grantDays} jours`);
            setGrantEmail('');
            setGrantNotes('');

            // Refresh user list
            const data = await fetcher<UserAdmin[]>('/api/admin/users');
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'attribution');
        } finally {
            setIsGranting(false);
        }
    };

    const handleRevokeAccess = async (userId: number, userEmail: string) => {
        if (!confirm(`Révoquer l'accès demo de ${userEmail} ?`)) return;

        setError(null);
        setSuccess(null);

        try {
            await fetcher(`/api/admin/demo-access/${userId}`, {
                method: 'DELETE',
            });

            setSuccess(`Accès demo révoqué pour ${userEmail}`);

            // Refresh user list
            const data = await fetcher<UserAdmin[]>('/api/admin/users');
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la révocation');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (!user?.is_superuser) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Panel Admin"
                subtitle="Gestion des accès demo"
            />

            {error && (
                <Alert variant="error" className="mb-6">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 underline">×</button>
                </Alert>
            )}

            {success && (
                <Alert variant="success" className="mb-6">
                    {success}
                    <button onClick={() => setSuccess(null)} className="ml-2 underline">×</button>
                </Alert>
            )}

            {/* Grant Access Form */}
            <div className={`${CARD_VARIANTS.default} mb-8`}>
                <h2 className="text-xl font-black uppercase mb-4 text-black">Accorder un accès demo</h2>
                <form onSubmit={handleGrantAccess} className="space-y-4">
                    <div>
                        <label className="block font-bold mb-1 text-black">Email de l'utilisateur</label>
                        <input
                            type="email"
                            value={grantEmail}
                            onChange={(e) => setGrantEmail(e.target.value)}
                            required
                            className={`w-full p-3 ${BORDERS.normal} border-black focus:outline-none focus:ring-2 focus:ring-orange-500`}
                            placeholder="utilisateur@example.com"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block font-bold mb-1 text-black">Durée (jours)</label>
                            <select
                                value={grantDays}
                                onChange={(e) => setGrantDays(Number(e.target.value))}
                                className={`w-full p-3 ${BORDERS.normal} border-black focus:outline-none`}
                            >
                                <option value={7}>7 jours</option>
                                <option value={14}>14 jours</option>
                                <option value={30}>30 jours</option>
                                <option value={60}>60 jours</option>
                                <option value={90}>90 jours</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block font-bold mb-1 text-black">Notes (optionnel)</label>
                            <input
                                type="text"
                                value={grantNotes}
                                onChange={(e) => setGrantNotes(e.target.value)}
                                className={`w-full p-3 ${BORDERS.normal} border-black focus:outline-none`}
                                placeholder="Beta tester, Influencer..."
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isGranting || !grantEmail}
                    >
                        {isGranting ? 'Attribution...' : 'Accorder l\'accès'}
                    </Button>
                </form>
            </div>

            {/* Users List */}
            <div className={`${CARD_VARIANTS.default}`}>
                <h2 className="text-xl font-black uppercase mb-4 text-black">
                    Utilisateurs ({users.length})
                </h2>

                {loading ? (
                    <p className="text-gray-600">Chargement...</p>
                ) : (
                    <div className="space-y-3">
                        {users.map((u) => (
                            <div
                                key={u.id}
                                className={`p-4 ${BORDERS.thin} flex items-center justify-between gap-4`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold truncate text-black">{u.email}</div>
                                    <div className="text-sm text-gray-600 flex flex-wrap gap-2 mt-1">
                                        <span>Inscrit le {formatDate(u.created_at)}</span>
                                        {u.is_superuser && (
                                            <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs font-bold rounded">
                                                Admin
                                            </span>
                                        )}
                                        {u.has_api_key && (
                                            <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-bold rounded">
                                                Clé API
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {u.demo_access?.is_active ? (
                                        <>
                                            <span className="px-3 py-1 bg-cyan-200 text-cyan-800 text-sm font-bold rounded border-2 border-black">
                                                Demo → {formatDate(u.demo_access.expires_at)}
                                            </span>
                                            <Button
                                                variant="danger"
                                                onClick={() => handleRevokeAccess(u.id, u.email)}
                                            >
                                                Révoquer
                                            </Button>
                                        </>
                                    ) : u.demo_access ? (
                                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded">
                                            Demo expiré/révoqué
                                        </span>
                                    ) : !u.has_api_key ? (
                                        <span className="text-sm text-gray-500">
                                            Sans accès API
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
