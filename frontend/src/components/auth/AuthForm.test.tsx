/**
 * Tests for AuthForm component.
 * 
 * Tests use language-agnostic matchers since i18n may use
 * browser language detection in the test environment.
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

            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password|mot de passe/i)).toBeInTheDocument();
            // Login button - matches English (Sign in) or French (Se connecter)
            expect(screen.getByRole('button', { name: /sign in|connecter/i })).toBeInTheDocument();
        });

        it('submits valid data to login', async () => {
            renderWithRouter(<AuthForm mode="login" />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email/i), 'test@example.com');
            await user.type(screen.getByLabelText(/password|mot de passe/i), 'password123');
            await user.click(screen.getByRole('button', { name: /sign in|connecter/i }));

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
            await user.type(screen.getByLabelText(/password|mot de passe/i), 'password123');
            await user.click(screen.getByRole('button', { name: /sign in|connecter/i }));

            await waitFor(() => {
                expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
            });
        });

        it('validates required fields', async () => {
            renderWithRouter(<AuthForm mode="login" />);
            const user = userEvent.setup();

            await user.click(screen.getByRole('button', { name: /sign in|connecter/i }));

            await waitFor(() => {
                // Check for any validation error message (Email required or Password required)
                const errorMessages = screen.queryAllByText(/required|requis/i);
                expect(errorMessages.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Mode: Register', () => {
        it('renders registration form correctly', () => {
            renderWithRouter(<AuthForm mode="register" />);

            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            // Get all password fields
            const passwordFields = screen.getAllByLabelText(/password|mot de passe/i);
            expect(passwordFields).toHaveLength(2);
            // Register button - matches English (Sign up) or French (S'inscrire)
            expect(screen.getByRole('button', { name: /sign up|inscrire/i })).toBeInTheDocument();
        });

        it('submits valid data to register', async () => {
            renderWithRouter(<AuthForm mode="register" />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email/i), 'new@example.com');
            const passwordFields = screen.getAllByLabelText(/password|mot de passe/i);
            await user.type(passwordFields[0], 'newpassword');
            await user.type(passwordFields[1], 'newpassword');
            await user.click(screen.getByRole('button', { name: /sign up|inscrire/i }));

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
            const passwordFields = screen.getAllByLabelText(/password|mot de passe/i);
            await user.type(passwordFields[0], 'password');
            await user.type(passwordFields[1], 'mismatch');
            await user.click(screen.getByRole('button', { name: /sign up|inscrire/i }));

            await waitFor(() => {
                // Check for mismatch error
                expect(screen.getByText(/match|correspondent/i)).toBeInTheDocument();
                expect(mockRegister).not.toHaveBeenCalled();
            });
        });

        it('displays error on failed registration', async () => {
            mockRegister.mockRejectedValueOnce(new Error('User already exists'));
            renderWithRouter(<AuthForm mode="register" />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email/i), 'test@example.com');
            const passwordFields = screen.getAllByLabelText(/password|mot de passe/i);
            await user.type(passwordFields[0], 'password');
            await user.type(passwordFields[1], 'password');
            await user.click(screen.getByRole('button', { name: /sign up|inscrire/i }));

            await waitFor(() => {
                expect(screen.getByText('User already exists')).toBeInTheDocument();
            });
        });
    });
});
