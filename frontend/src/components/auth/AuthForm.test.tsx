/**
 * Tests for AuthForm component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from './AuthForm';
import { BrowserRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock useAuth
const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        login: mockLogin,
        register: mockRegister,
    }),
}));

function renderWithRouter(ui: React.ReactElement) {
    return render(ui, { wrapper: BrowserRouter });
}

describe('AuthForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Mode: Login', () => {
        it('renders login form correctly', () => {
            renderWithRouter(<AuthForm mode="login" />);

            expect(screen.getByText(/connexion/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
            expect(screen.queryByLabelText(/confirmer/i)).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
        });

        it('submits valid data to login', async () => {
            renderWithRouter(<AuthForm mode="login" />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email/i), 'test@example.com');
            await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
            await user.click(screen.getByRole('button', { name: /se connecter/i }));

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith({
                    username: 'test@example.com',
                    password: 'password123',
                });
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
            });
        });

        it('displays error on failed login', async () => {
            mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
            renderWithRouter(<AuthForm mode="login" />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email/i), 'test@example.com');
            await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
            await user.click(screen.getByRole('button', { name: /se connecter/i }));

            await waitFor(() => {
                expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
            });
        });

        it('validates required fields', async () => {
            renderWithRouter(<AuthForm mode="login" />);
            const user = userEvent.setup();

            await user.click(screen.getByRole('button', { name: /se connecter/i }));

            await waitFor(() => {
                expect(screen.getByText('Email requis')).toBeInTheDocument();
                expect(screen.getByText('Mot de passe requis')).toBeInTheDocument();
            });
        });
    });

    describe('Mode: Register', () => {
        it('renders registration form correctly', () => {
            renderWithRouter(<AuthForm mode="register" />);

            expect(screen.getByText(/créer un compte/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/^mot de passe/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/confirmer/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeInTheDocument();
        });

        it('submits valid data to register', async () => {
            renderWithRouter(<AuthForm mode="register" />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email/i), 'new@example.com');
            await user.type(screen.getByLabelText(/^mot de passe/i), 'newpassword');
            await user.type(screen.getByLabelText(/confirmer/i), 'newpassword');
            await user.click(screen.getByRole('button', { name: /s'inscrire/i }));

            await waitFor(() => {
                expect(mockRegister).toHaveBeenCalledWith({
                    email: 'new@example.com',
                    password: 'newpassword',
                    confirmPassword: 'newpassword',
                });
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
            });
        });

        it('validates password mismatch', async () => {
            renderWithRouter(<AuthForm mode="register" />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email/i), 'new@example.com');
            await user.type(screen.getByLabelText(/^mot de passe/i), 'password');
            await user.type(screen.getByLabelText(/confirmer/i), 'mismatch');
            await user.click(screen.getByRole('button', { name: /s'inscrire/i }));

            await waitFor(() => {
                expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
                expect(mockRegister).not.toHaveBeenCalled();
            });
        });

        it('displays error on failed registration', async () => {
            mockRegister.mockRejectedValueOnce(new Error('User already exists'));
            renderWithRouter(<AuthForm mode="register" />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email/i), 'test@example.com');
            await user.type(screen.getByLabelText(/^mot de passe/i), 'password');
            await user.type(screen.getByLabelText(/confirmer/i), 'password');
            await user.click(screen.getByRole('button', { name: /s'inscrire/i }));

            await waitFor(() => {
                expect(screen.getByText('User already exists')).toBeInTheDocument();
            });
        });
    });
});
