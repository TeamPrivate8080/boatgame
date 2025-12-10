export function SetupAuthRegisters() {
    const LoginBtn = document.getElementById('LoginBTN');
    const RegBtn = document.getElementById('RegisterBTN');
    const overlay = document.getElementById('overlay');

    LoginBtn.addEventListener('click', () => {
        document.getElementById('LoginForm').classList.remove('hidden');
        document.getElementById('RegisterForm').classList.add('hidden');
        LoginBtn.classList.add('bg-gradient-to-r', 'from-cyan-500', 'to-blue-500', 'text-gray-900');
        LoginBtn.classList.remove('bg-gray-700/50', 'text-cyan-200');
        RegBtn.classList.add('bg-gray-700/50', 'text-cyan-200');
        RegBtn.classList.remove('bg-gradient-to-r', 'from-cyan-500', 'to-blue-500', 'text-gray-900');
    });

    RegBtn.addEventListener('click', () => {
        document.getElementById('RegisterForm').classList.remove('hidden');
        document.getElementById('LoginForm').classList.add('hidden');
        RegBtn.classList.add('bg-gradient-to-r', 'from-cyan-500', 'to-blue-500', 'text-gray-900');
        RegBtn.classList.remove('bg-gray-700/50', 'text-cyan-200');
        LoginBtn.classList.add('bg-gray-700/50', 'text-cyan-200');
        LoginBtn.classList.remove('bg-gradient-to-r', 'from-cyan-500', 'to-blue-500', 'text-gray-900');
    });

    document.getElementById('CloseModal').addEventListener('click', () => {
        document.getElementsByClassName('AuthModal')[0].classList.add('hidden');
        overlay.classList.add('hidden');
    });

    overlay.addEventListener('click', () => {
        document.getElementsByClassName('AuthModal')[0].classList.add('hidden');
        overlay.classList.add('hidden');
    });

    document.getElementsByClassName('OpenAuth')[0].onclick = () => {
        document.getElementsByClassName('AuthModal')[0].classList.remove('hidden');
        overlay.classList.remove('hidden');
    }
}