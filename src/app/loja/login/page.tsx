import LoginForm from "./login-form";
import Link from "next/link";

function TruckIllustration() {
  return (
    <svg className="login-illustration" viewBox="0 0 720 420" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="truckBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5EA2FF" />
          <stop offset="1" stopColor="#1463E6" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12345E" />
          <stop offset="1" stopColor="#07182E" />
        </linearGradient>
      </defs>
      <path d="M0 306C112 270 196 282 298 306c104 25 218 16 422-33v147H0V306Z" fill="url(#road)" opacity=".95" />
      <path d="M55 315h610" stroke="#5EA2FF" strokeOpacity=".3" strokeWidth="3" strokeDasharray="24 18" />
      <g transform="translate(88 106)">
        <rect x="0" y="55" width="360" height="142" rx="24" fill="url(#truckBody)" />
        <path d="M360 103h104c14 0 26 7 34 19l37 59c5 8-1 16-10 16H360V103Z" fill="#3D86EA" />
        <path d="M384 121h69c8 0 15 4 20 11l25 42h-114v-53Z" fill="#0B2445" opacity=".95" />
        <path d="M25 82h150v84H25V82Z" fill="#0B2445" opacity=".9" />
        <path d="M42 98h58v52H42V98Zm74 0h42v52h-42V98Z" fill="#4A73A5" opacity=".7" />
        <rect x="194" y="88" width="130" height="74" rx="14" fill="#4E92F2" />
        <path d="M214 110h90M214 129h68M214 148h46" stroke="#244F86" strokeWidth="8" strokeLinecap="round" opacity=".55" />
        <circle cx="104" cy="205" r="38" fill="#06162C" />
        <circle cx="104" cy="205" r="18" fill="#5277A3" />
        <circle cx="438" cy="205" r="38" fill="#06162C" />
        <circle cx="438" cy="205" r="18" fill="#5277A3" />
        <rect x="312" y="72" width="32" height="30" rx="8" fill="#8FC0FF" />
      </g>
      <g transform="translate(482 45) rotate(6)">
        <rect width="166" height="56" rx="28" fill="#5EA2FF" />
        <circle cx="30" cy="28" r="15" fill="#08254B" />
        <path d="m23 28 5 5 9-11" stroke="#5EA2FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="55" y="34" fill="#08254B" fontSize="18" fontWeight="700" fontFamily="Arial, sans-serif">Operação ativa</text>
      </g>
      <g transform="translate(22 232) rotate(-4)">
        <rect width="205" height="58" rx="29" fill="#5EA2FF" />
        <circle cx="31" cy="29" r="15" fill="#08254B" />
        <path d="M23 29h16M31 21v16" stroke="#5EA2FF" strokeWidth="3" strokeLinecap="round" />
        <text x="56" y="26" fill="#08254B" fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">Frota organizada</text>
        <text x="56" y="44" fill="#5E80A6" fontSize="12" fontFamily="Arial, sans-serif">Tudo em um só lugar</text>
      </g>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-panel-heading">
            <div className="login-lock-icon" aria-hidden="true">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span className="eyebrow">Acesso restrito</span>
            <h2>Entrar no painel</h2>
            <p>Use suas credenciais para acessar a gestão da loja.</p>
          </div>

          <div className="login-card">
            <LoginForm />
            <div className="divider" />
            <Link href="/loja/criar-conta" className="login-back-link" style={{ display: "block", textAlign: "center", marginBottom: "0.75rem" }}>Criar minha conta</Link>
            <Link href="/" className="login-back-link">
              ← Voltar para consulta de veículo
            </Link>
          </div>

          <div className="login-help">
            <span className="login-help-dot" />
            Ambiente seguro para gestão da operação
          </div>
        </div>
      </section>
    </main>
  );
}
