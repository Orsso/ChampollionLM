import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks';
import { fetcher } from '../lib/api';
import { PageHeader } from '../components/ui/layout';
import { Button } from '../components/ui/buttons';
import { Badge, Alert } from '../components/ui/feedback';
import { Card } from '../components/ui/cards/Card';
import { BORDERS } from '../constants/styles';
import type { UserAdmin } from '../types';

/**
 * Admin Panel for managing demo access.
 * Only accessible to superusers.
 */
export function AdminPanel() {
    const { t } = useTranslation();
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
                setError(err instanceof Error ? err.message : t('admin.loadError'));
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

            setSuccess(t('admin.grantSuccess', { email: grantEmail, days: grantDays }));
            setGrantEmail('');
            setGrantNotes('');

            // Refresh user list
            const data = await fetcher<UserAdmin[]>('/api/admin/users');
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('admin.grantError'));
        } finally {
            setIsGranting(false);
        }
    };

    const handleRevokeAccess = async (userId: number, userEmail: string) => {
        if (!confirm(t('admin.revokeConfirm', { email: userEmail }))) return;

        setError(null);
        setSuccess(null);

        try {
            await fetcher(`/api/admin/demo-access/${userId}`, {
                method: 'DELETE',
            });

            setSuccess(t('admin.revokeSuccess', { email: userEmail }));

            // Refresh user list
            const data = await fetcher<UserAdmin[]>('/api/admin/users');
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('admin.revokeError'));
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
                title={t('admin.title')}
                subtitle={t('admin.subtitle')}
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
            <Card className="mb-8">
                <h2 className="text-xl font-black uppercase mb-4 text-black">{t('admin.grantAccess')}</h2>
                <form onSubmit={handleGrantAccess} className="space-y-4">
                    <div>
                        <label className="block font-bold mb-1 text-black">{t('admin.userEmail')}</label>
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
                            <label className="block font-bold mb-1 text-black">{t('admin.duration')}</label>
                            <select
                                value={grantDays}
                                onChange={(e) => setGrantDays(Number(e.target.value))}
                                className={`w-full p-3 ${BORDERS.normal} border-black focus:outline-none`}
                            >
                                <option value={7}>{t('admin.daysOption', { count: 7 })}</option>
                                <option value={14}>{t('admin.daysOption', { count: 14 })}</option>
                                <option value={30}>{t('admin.daysOption', { count: 30 })}</option>
                                <option value={60}>{t('admin.daysOption', { count: 60 })}</option>
                                <option value={90}>{t('admin.daysOption', { count: 90 })}</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block font-bold mb-1 text-black">{t('admin.notes')}</label>
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
                        {isGranting ? t('admin.granting') : t('admin.grantBtn')}
                    </Button>
                </form>
            </Card>

            {/* Users List */}
            <Card>
                <h2 className="text-xl font-black uppercase mb-4 text-black">
                    {t('admin.users')} ({users.length})
                </h2>

                {loading ? (
                    <p className="text-gray-600">{t('common.loading')}</p>
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
                                        <span>{t('admin.registeredOn')} {formatDate(u.created_at)}</span>
                                        {u.is_superuser && (
                                            <Badge color="purple">{t('admin.adminBadge')}</Badge>
                                        )}
                                        {u.has_api_key && (
                                            <Badge color="green">{t('admin.apiKeyBadge')}</Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {u.demo_access?.is_active ? (
                                        <>
                                            <Badge color="cyan">
                                                Demo → {formatDate(u.demo_access.expires_at)}
                                            </Badge>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRevokeAccess(u.id, u.email)}
                                            >
                                                {t('admin.revoke')}
                                            </Button>
                                        </>
                                    ) : u.demo_access ? (
                                        <Badge color="gray">
                                            {t('admin.demoExpired')}
                                        </Badge>
                                    ) : !u.has_api_key ? (
                                        <span className="text-sm text-gray-500">
                                            {t('admin.noApiAccess')}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
