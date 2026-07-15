import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, CheckCircle, HelpCircle, ArrowRight, Play, RefreshCw, X, Shield, ShieldAlert, Cpu, Award
} from 'lucide-react';

// ==========================================
// 1. QUESTION DATA & SIMULATED TARGETS
// ==========================================

interface Question {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  task: string;
  hint: string;
  correctAnswer: string;
  placeholder: string;
  learnMore: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: 'Nmapの基本ホスト探索 (Pingスキャン)',
    difficulty: 'Easy',
    description: '対象ネットワーク上でアクティブなホストを特定することは、ペネトレーションテストの第一歩です。`-sn`フラグ（以前は`-sP`）を使用すると、ポートスキャンを実行せずにホスト探索（Pingスキャン）のみを行います。これにより迅速に稼働中のIPを検出できます。',
    task: 'ローカルサブネット内を探索するため、ターミナルで `nmap -sn 192.168.1.0/24` を実行してください。検出されたアクティブな対象ホストのIPアドレスを解答してください。',
    hint: 'ターミナルで `nmap -sn 192.168.1.0/24` と入力し、ルーター以外の稼働中ホストのIPアドレス（192.168.1.x）を探します。',
    correctAnswer: '192.168.1.45',
    placeholder: '例: 192.168.1.100',
    learnMore: '`-sn` スキャンは、ICMPエコー要求、TCP SYN（ポート443）、TCP ACK（ポート80）、およびICMPタイムスタンプ要求を組み合わせて、ホストがアクティブかどうかを判断します。非特権ユーザーの場合は、対象ポートにTCP SYNパケットを送信します。'
  },
  {
    id: 2,
    title: 'TCP SYNスキャンによるオープンポート検出',
    difficulty: 'Easy',
    description: 'ホストが稼働していることが分かったら、次は開いているポートを特定します。`-sS` は「TCP SYNスキャン」（またはハーフオープンスキャン）と呼ばれ、Nmapのデフォルトかつ最も人気のあるスキャンです。スリーウェイ・ハンドシェイクを完全に確立しないため、標的のログに残りづらく、非常に高速です。',
    task: '先ほど見つけたアクティブな標的 `192.168.1.45` に対して `nmap -sS 192.168.1.45` を実行し、オープン（open）しているWebサービスの標準ポート番号を解答してください。',
    hint: 'ターミナルで `nmap -sS 192.168.1.45` と入力し、出力結果の「PORT」列にある「open」状態のポート番号を確認します。',
    correctAnswer: '80',
    placeholder: '例: 22',
    learnMore: 'SYNスキャンは、SYNパケットを送信し、SYN-ACKが返ってきたら即座にRSTパケットを送信して接続を終了します。これにより、OSのアプリケーション層接続ログ（Webサーバーアクセスログなど）に履歴を残さずにポートの開閉を確認できます。'
  },
  {
    id: 3,
    title: 'サービス・バージョン検出 (Service Version)',
    difficulty: 'Easy',
    description: 'ポートが開いていることだけでなく、そこで稼働している具体的な「ソフトウェア名とバージョン」を特定することは脆弱性探査において極めて重要です。`-sV` フラグを使うと、Nmapは開いているポートに特定のプローブを送信し、バナー情報を読み取ってバージョンを特定します。',
    task: 'ポート80で動作しているWebサーバーのバージョンを特定するため、 `nmap -sV -p 80 192.168.1.45` を実行してください。検出されたWebサーバーソフトウェア名とバージョン情報を正確に解答してください。',
    hint: '`nmap -sV -p 80 192.168.1.45` のスキャン結果の「VERSION」列に表示される文字列（例: Apache/x.x.xx）をコピーして入力します。',
    correctAnswer: 'Apache/2.4.41',
    placeholder: '例: Apache/2.4.41 または nginx/1.18.0',
    learnMore: '`-sV` はNmapのデータベースにある数千ものサービスシグネチャと、応答パケットの「バナー」を照合します。強度は0から9まであり、高いほど多くのプローブを試します。'
  },
  {
    id: 4,
    title: 'OS検出スキャン (OS Detection)',
    difficulty: 'Easy',
    description: 'オペレーティングシステム（OS）の特定は、攻撃対象（エクスプロイト）を選択する上で不可欠です。`-O` フラグを使用すると、NmapはTCP/IPスタックの応答フィンガープリントを分析し、ターゲットマシンのOS種類やカーネルバージョンを高い精度で推測します。',
    task: '対象ホスト `192.168.1.45` のOSを検出するため、 `nmap -O 192.168.1.45` を実行してください。結果から推測された主要なOSファミリー（Linux, Windows, macOSなど）を解答してください。',
    hint: 'ターミナルで `nmap -O 192.168.1.45` を実行し、「OS details」または「Running:」の行にある代表的なOS名（Linuxなど）を解答します。',
    correctAnswer: 'Linux',
    placeholder: '例: Linux',
    learnMore: 'OS検出は、TCPのウィンドウサイズ、TTL、DF（Don\'t Fragment）ビット、オプション順序など、各OSベンダーのIPスタック実装のわずかな違い（フィンガープリント）を利用して識別します。'
  },
  {
    id: 5,
    title: '全ポートスキャンと隠されたサービスの発見',
    difficulty: 'Medium',
    description: 'デフォルトでNmapは、最もよく使われる「上位1000個のポート」のみをスキャンします。しかし、管理者がセキュリティ回避やバックドア運用の目的で、標準外の高位ポート（例: 1024〜65535）にサービスを隠すことがよくあります。`-p-` フラグを使用すると、1から65535までの全ポートをスキャンできます。',
    task: 'ターゲット `192.168.1.45` の全てのポートを調査するため、 `nmap -p- 192.168.1.45` を実行してください。高位ポート（1000番以降）で開いているもう一つのポート番号を解答してください。',
    hint: '`nmap -p- 192.168.1.45` を実行します。1000番以上のポートで「open」になっている数値を解答します。',
    correctAnswer: '1337',
    placeholder: '例: 8080',
    learnMore: '全ポートスキャン（`-p-`）は非常に強力ですが、デフォルトの上位1000ポートスキャンに比べてパケット送信量が65倍に増えるため、スキャン完了までに時間がかかります。ネットワーク帯域の負荷にも注意が必要です。'
  },
  {
    id: 6,
    title: 'アグレッシブスキャン (Aggressive Scan)',
    difficulty: 'Medium',
    description: '一回コマンドを打つだけで、OS検出（`-O`）、サービスバージョン検出（`-sV`）、スクリプトスキャン（`-sC`）、およびルート追跡（`traceroute`）を同時に有効にできる、極めて便利な万能フラグが `-A`（アグレッシブスキャン）です。',
    task: '隠されたポート1337にアプローチするため、 `nmap -A -p 1337 192.168.1.45` を実行してください。このポートで動作している不審なサービスの登録名（SERVICE）を解答してください。',
    hint: 'ターミナルで `nmap -A -p 1337 192.168.1.45` を走らせ、ポート1337の「SERVICE」列に書かれている単語を解答します。',
    correctAnswer: 'backdoor',
    placeholder: '例: backdoor または ssh',
    learnMore: '`-A` は強力な情報収集フラグですが、標的ホストや侵入検知システム（IDS）に対して非常に「うるさい（検知されやすい）」スキャンであるため、実際の潜入フェーズでの使用には注意が必要です。'
  },
  {
    id: 7,
    title: 'Nmapスクリプトエンジン (NSE) による脆弱性検査',
    difficulty: 'Medium',
    description: 'Nmapには「NSE (Nmap Script Engine)」と呼ばれる強力な自動スクリプト実行エンジンが搭載されています。これにより、開いているポートに対して自動的に既知の脆弱性（CVE）が存在するかを診断することができます。`--script vuln` フラグを指定すると、安全な範囲で脆弱性チェックを行います。',
    task: 'ポート80で動作しているApache Webサーバーに脆弱性があるか確認するため、 `nmap --script vuln -p 80 192.168.1.45` を実行してください。検出された脆弱性の「CVE識別番号」（CVE-XXXX-XXXX）を解答してください。',
    hint: 'NSE脆弱性スクリプトの出力に表示される、最も重大なパストラバーサル脆弱性の「CVE-2021-41773」を探してください。',
    correctAnswer: 'CVE-2021-41773',
    placeholder: '例: CVE-2021-41773',
    learnMore: 'NSEスクリプトはLua言語で書かれており、脆弱性検出（vuln）、情報収集（discovery）、マルウェア検出（malware）、ブルートフォース（auth）、DoS攻撃テスト（dos）などのカテゴリに分類されています。'
  },
  {
    id: 8,
    title: '実践演習1: パケット断片化によるファイアーウォール回避',
    difficulty: 'Hard',
    description: 'ここからは実践演習です！最初の標的ホスト `10.0.8.20` は、ポートスキャンパケットを監視しドロップする簡易的なパケットフィルタリング・ファイアーウォール（FW）によって保護されています。通常のSYNスキャン `nmap -sS 10.0.8.20` を実行しても、すべてのパケットが遮断されてしまいます（filtered）。\n\nパケットを小さく断片化して送信する `-f` フラグ（フラグメンテーション）や、一般的なサービスに偽装したソースポート指定（DNS用のポート53など、`-g 53`）を組み合わせることで、単純なヘッダー検査しか行わないファイアーウォールをバイパスできます。',
    task: 'ファイアーウォールを突破するため、パケット断片化およびソースポート53偽装オプションを使い、 `nmap -f -g 53 10.0.8.20` を実行してください。保護の裏でオープンになっている、サーバー管理用のポート番号を突き止めて解答してください。',
    hint: '普通にスキャンするとfilteredになりますが、 `nmap -f -g 53 10.0.8.20` を実行するとポート「22」の状態が「open」として返ってきます。',
    correctAnswer: '22',
    placeholder: '例: 22',
    learnMore: '`-f` はTCPヘッダーを複数の小さなパケット（8バイトのフラグメントなど）に分割して送信します。多くの単純なパケットフィルタは最初の断片しかヘッダー解析できないため、後続のパケットを通してしまう脆弱性を突いています。また `-g 53` は、FWが内部向けDNSパケットを無条件で通すルールを悪用します。'
  },
  {
    id: 9,
    title: '実践演習2: デコイスキャンによる送信元IPの偽装と追跡攪乱',
    difficulty: 'Hard',
    description: 'セキュリティ監視が厳重なデータベースホスト `10.0.8.35` をスキャンすると、攻撃者の実IPがセキュリティログ（SIEM）に記録され、即座にブロックや逆探知が行われます。\n\nこれを回避するために `-D` (デコイスキャン) を使用します。このオプションを使うと、スキャンパケットの中に複数の「偽の送信元IPアドレス（デコイ）」を混ぜて送信します。これにより、相手のログには大量の無関係なIPから同時攻撃されたように記録され、攻撃者の本当のIPを完全にカモフラージュできます！',
    task: '監視の目を欺くため、ランダムなデコイを5つ生成するコマンド `nmap -D RND:5 10.0.8.35` を実行してください。このホストで稼働しているセキュアなデータベースサービスのポート番号を特定して解答してください。',
    hint: 'ターミナルで `nmap -D RND:5 10.0.8.35` を実行し、開いている代表的なデータベースポート「3306」（MySQL）を見つけて解答します。',
    correctAnswer: '3306',
    placeholder: '例: 3306',
    learnMore: 'デコイスキャン（`-D`）は、指定したIP（または `RND:数` で自動生成したランダムIP）になりすましたSYNパケットと、実IPからのパケットを多重送信します。標的からは複数箇所からの同時スキャンに見えるため、アクティブホストのログ監査を実質的に不可能にします。'
  },
  {
    id: 10,
    title: '実践演習3: タイミング調整によるIDS(侵入検知システム)突破',
    difficulty: 'Hard',
    description: '最後の標的ホスト `10.0.8.99` は、一定時間内のスキャン要求頻度を検知する高度な「IDS（侵入検知システム）」を備えています。通常の速度（デフォルトはT3）や高速（T4, T5）でスキャンを実行すると、IDSが異常検知アラートを発報し、あなたのIPアドレスは自動的に一定時間ブロック（拒否）されてしまいます。\n\nこれを回避するためには、スキャン速度を極限まで下げる「スキャンタイミングテンプレート」を使用します。`-T` フラグに `0` (Paranoid) または `2` (Polite / 丁寧) を指定することで、パケット間の間隔を数秒〜数分空け、通常のトラフィックに紛れ込ませて検出を回避します。',
    task: 'IDSに検知されないよう慎重に（Politeタイミング） `nmap -T2 10.0.8.99` を実行してください。その後、開いているWebサーバーに `curl 10.0.8.99` コマンドでアクセスし、そこに隠されている秘密のフラグ（THM{...}）を特定して解答してください。',
    hint: '`nmap -T4 10.0.8.99` を走らせるとIDSに検知されアクセス不能のエラーが出ます。 `nmap -T2 10.0.8.99` を実行してポート80が開いているのを確認したあと、 `curl 10.0.8.99` を打つとフラグ「THM{NMAP_IDS_BYPASS_SUCCESS}」が表示されます。',
    correctAnswer: 'THM{NMAP_IDS_BYPASS_SUCCESS}',
    placeholder: '例: THM{SOMETHING}',
    learnMore: 'Nmapのタイミング設定は `-T0` から `-T5` まであります。T0とT1はIDSを回避する目的（パケット間に最大5分/15秒の間隔）で設計されています。T2はパケット間に0.4秒の間隔を置き、スキャン速度を落としつつ帯域負荷と検知可能性を抑えます。'
  }
];

// ==========================================
// 2. MAIN APPLET COMPONENT
// ==========================================

interface NmapAppProps {
  onClose?: () => void;
}

export default function NmapApp({ onClose }: NmapAppProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, { success: boolean, msg: string } | null>>({});
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Welcome to the TryHackMe Nmap Sandbox Terminal v1.4.2',
    'Type "help" to see available commands. Type "clear" to empty the screen.',
    'Ready for scan emulation. Target environment is simulated.',
    ''
  ]);
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isCommandRunning, setIsCommandRunning] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [idsBanned, setIdsBanned] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeQuestion = QUESTIONS[currentIdx];

  // Auto scroll terminal to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Focus input when clicking terminal container
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Check user answer
  const handleSubmitAnswer = (qId: number) => {
    const ans = (userAnswers[qId] || '').trim();
    const correct = QUESTIONS.find(q => q.id === qId)?.correctAnswer || '';
    
    if (ans.toLowerCase() === correct.toLowerCase()) {
      setCompleted(prev => ({ ...prev, [qId]: true }));
      setShowFeedback(prev => ({ 
        ...prev, 
        [qId]: { success: true, msg: '正解です！お見事！お祝いのファンファーレが心の中に響きます。次の問題に進みましょう。' } 
      }));
    } else {
      setShowFeedback(prev => ({ 
        ...prev, 
        [qId]: { success: false, msg: '残念、不正解です。解答フォーマットや出力結果のスペル、大文字小文字を確認してください。' } 
      }));
    }
  };

  // Run simulated commands in terminal
  const executeCommand = async (cmdString: string) => {
    const rawCmd = cmdString.trim();
    if (!rawCmd) return;

    setCommandHistory(prev => [rawCmd, ...prev]);
    setHistoryIdx(-1);
    setIsCommandRunning(true);

    const logs = [...terminalLogs, `$ ${rawCmd}`];
    setTerminalLogs(logs);
    setCurrentCommand('');

    // Simulate async network processing latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const parts = rawCmd.split(/\s+/);
    const base = parts[0].toLowerCase();

    let output: string[] = [];

    if (base === 'help') {
      output = [
        '利用可能なコマンド一覧:',
        '  help              - このヘルプメッセージを表示',
        '  clear             - 画面クリア',
        '  ping [IP]         - 対象ホストへの疎通確認を行う',
        '  nmap [options] IP - 対象ホストをスキャンする',
        '  curl [IP]         - 対象のWebページ（ポート80）をリクエストする',
        '  ssh [IP]          - 対象へSSH接続を試みる',
        ''
      ];
    } else if (base === 'clear') {
      setTerminalLogs([]);
      setIsCommandRunning(false);
      return;
    } else if (base === 'ping') {
      const target = parts[1];
      if (!target) {
        output = ['Error: ping command requires a target IP address. Example: ping 192.168.1.45'];
      } else if (target === '192.168.1.45' || target === '10.0.8.20' || target === '10.0.8.35' || target === '10.0.8.99') {
        output = [
          `PING ${target} (${target}) 56(84) bytes of data.`,
          `64 bytes from ${target}: icmp_seq=1 ttl=64 time=1.24 ms`,
          `64 bytes from ${target}: icmp_seq=2 ttl=64 time=1.11 ms`,
          `64 bytes from ${target}: icmp_seq=3 ttl=64 time=1.45 ms`,
          `--- ${target} ping statistics ---`,
          '3 packets transmitted, 3 received, 0% packet loss, time 2004ms',
          'rtt min/avg/max/mdev = 1.112/1.267/1.451/0.141 ms'
        ];
      } else if (target.startsWith('192.168.1.')) {
        output = [
          `PING ${target} (${target}) 56(84) bytes of data.`,
          'From 192.168.1.1 icmp_seq=1 Destination Host Unreachable',
          'From 192.168.1.1 icmp_seq=2 Destination Host Unreachable',
          `--- ${target} ping statistics ---`,
          '2 packets transmitted, 0 received, 100% packet loss, time 1002ms'
        ];
      } else {
        output = [`ping: unknown host ${target}`];
      }
    } else if (base === 'curl') {
      const target = parts[1];
      if (!target) {
        output = ['Error: curl command requires a target IP address. Example: curl 192.168.1.45'];
      } else if (target === '192.168.1.45') {
        output = [
          'HTTP/1.1 200 OK',
          'Date: Sun, 05 Jul 2026 00:30:00 GMT',
          'Server: Apache/2.4.41 (Ubuntu)',
          'Content-Type: text/html; charset=UTF-8',
          'Content-Length: 154',
          '',
          '<html>',
          '<head><title>Welcome to Ubuntu Server</title></head>',
          '<body>',
          '<h1>Under Construction</h1>',
          '<p>This is a default Apache2 web server page on local subnet 192.168.1.45.</p>',
          '</body>',
          '</html>'
        ];
      } else if (target === '10.0.8.99') {
        if (idsBanned) {
          output = [
            'curl: (7) Failed to connect to 10.0.8.99 port 80: Connection timed out',
            'Reason: Your IP is currently blocked by the target Intrusion Prevention System (IPS) due to aggressive scanning.'
          ];
        } else {
          output = [
            'HTTP/1.1 200 OK',
            'Date: Sun, 05 Jul 2026 00:35:12 GMT',
            'Server: Apache/2.4.52 (Debian)',
            'Content-Type: text/html',
            'Content-Length: 212',
            '',
            '<html>',
            '<head><title>Secure Flag Storage</title></head>',
            '<body>',
            '<h1>CONGRATULATIONS!</h1>',
            '<p>You successfully evaded the IDS filters using polite timing (T2) scanning!</p>',
            '<p>Here is your secret flag capture:</p>',
            '<h2 style="color:limegreen;">THM{NMAP_IDS_BYPASS_SUCCESS}</h2>',
            '</body>',
            '</html>'
          ];
        }
      } else {
        output = [
          `curl: (7) Failed to connect to ${target} port 80: Connection refused`
        ];
      }
    } else if (base === 'ssh') {
      const target = parts[1];
      if (!target) {
        output = ['Error: ssh command requires a target IP address. Example: ssh 10.0.8.20'];
      } else if (target === '10.0.8.20') {
        output = [
          'The authenticity of host \'10.0.8.20 (10.0.8.20)\' can\'t be established.',
          'ECDSA key fingerprint is SHA256:d8N7G87f8G7Fg8d7F8gd7Fg87DFg87G8fg.',
          'Are you sure you want to continue connecting (yes/no/[fingerprint])? yes',
          'Warning: Permanently added \'10.0.8.20\' (ECDSA) to the list of known hosts.',
          'root@10.0.8.20\'s password: ',
          'Permission denied, please try again.'
        ];
      } else {
        output = [
          `ssh: connect to host ${target} port 22: Connection refused`
        ];
      }
    } else if (base === 'nmap') {
      // Parse nmap flags
      const isPingScan = parts.includes('-sn') || parts.includes('-sP');
      const isSynScan = parts.includes('-sS');
      const isVersionScan = parts.includes('-sV');
      const isOsScan = parts.includes('-O');
      const isAllPorts = parts.includes('-p-');
      const isAggressive = parts.includes('-A');
      const isScriptVuln = parts.includes('--script') && parts.includes('vuln');
      const isFragment = parts.includes('-f');
      const isDecoy = parts.includes('-Decoy') || parts.includes('-D');
      const isTimingPolite = parts.includes('-T2') || parts.includes('T2');
      const isTimingFast = parts.includes('-T4') || parts.includes('-T5') || parts.includes('T4') || parts.includes('T5');
      const hasSourcePort53 = parts.includes('-g') && parts.includes('53');
      
      // Extract target IP (usually the last parameter)
      const targetIp = parts[parts.length - 1];

      if (!targetIp || targetIp === 'nmap') {
        output = [
          'Nmap 7.92 ( https://nmap.org )',
          'Usage: nmap [Scan Type...] [Options] {target specification}',
          'WARNING: No targets specified, so 0 hosts scanned.',
          'Try "help" for a quick command guide in this sandbox app.'
        ];
      } else if (targetIp.includes('192.168.1.0/24')) {
        if (isPingScan) {
          output = [
            'Starting Nmap 7.92 ( https://nmap.org ) at 2026-07-05 00:30 UTC',
            'Nmap scan report for 192.168.1.1 (gateway.local)',
            'Host is up (0.0012s latency).',
            'MAC Address: 00:11:22:33:44:55 (Netgear Router)',
            'Nmap scan report for 192.168.1.45 (ubuntu-server.local)',
            'Host is up (0.0045s latency).',
            'MAC Address: AA:BB:CC:DD:EE:FF (Ubuntu server host)',
            'Nmap done: 256 IP addresses (2 hosts up) scanned in 2.18 seconds'
          ];
        } else {
          output = [
            'Starting Nmap 7.92 ( https://nmap.org ) at 2026-07-05 00:30 UTC',
            'Nmap scan report for 192.168.1.0/24 (Range)',
            'Note: To perform port scans on a range, please run standard scans on individual active targets.',
            'Nmap done: 256 IP addresses scanned in 5.40 seconds'
          ];
        }
      } else if (targetIp === '192.168.1.45') {
        output = [
          'Starting Nmap 7.92 ( https://nmap.org ) at 2026-07-05 00:31 UTC',
          'Nmap scan report for 192.168.1.45 (ubuntu-server.local)',
          'Host is up (0.0041s latency).',
          'Not shown: 998 closed tcp ports (reset)'
        ];

        if (isAllPorts) {
          // All 65535 ports
          output.push(
            'PORT     STATE SERVICE',
            '80/tcp   open  http',
            '1337/tcp open  waste'
          );
          if (isVersionScan || isAggressive) {
            output.push(
              '1337/tcp open  waste   backdoor (Custom Ruby Shell v1.0.8)'
            );
          }
        } else if (isScriptVuln) {
          output.push(
            'PORT     STATE SERVICE',
            '80/tcp   open  http',
            '| http-vuln-cve2021-41773:',
            '|   VULNERABLE:',
            '|   Apache HTTP Server 2.4.49/2.4.50 Path Traversal & RCE',
            '|     State: VULNERABLE (Exploitable)',
            '|     IDs:  CVE:CVE-2021-41773',
            '|     Description:',
            '|       A flaw was found in a change made to path normalization in Apache HTTP Server 2.4.49.',
            '|       An attacker could use a path traversal attack to map URLs to files outside the expected document root.'
          );
        } else if (isVersionScan) {
          output.push(
            'PORT     STATE SERVICE VERSION',
            '80/tcp   open  http    Apache/2.4.41 (Ubuntu)'
          );
        } else if (isOsScan || isAggressive) {
          output.push(
            'PORT     STATE SERVICE',
            '80/tcp   open  http',
            'Device type: general purpose',
            'Running: Linux 5.X',
            'OS details: Linux 5.4.0-74-generic (Ubuntu LTS)',
            'OS Guessing Accuracy: 97%'
          );
        } else {
          // Standard scan
          output.push(
            'PORT     STATE SERVICE',
            '80/tcp   open  http'
          );
        }
        output.push('Nmap done: 1 IP address (1 host up) scanned in 1.88 seconds');
      } else if (targetIp === '10.0.8.20') {
        // Firewall test
        output = [
          'Starting Nmap 7.92 ( https://nmap.org ) at 2026-07-05 00:32 UTC',
          'Nmap scan report for 10.0.8.20 (firewall-protected.local)',
          'Host is up (0.0055s latency).'
        ];

        if (isFragment && hasSourcePort53) {
          output.push(
            'PORT   STATE SERVICE',
            '22/tcp open  ssh',
            'Note: Successfully bypassed stateless packet filter using header fragmentation and source port 53 spoofing!'
          );
        } else {
          output.push(
            'All 1000 scanned ports on 10.0.8.20 are in state: filtered (no-response)',
            'Note: Packet filter has blocked your standard TCP probe packets.'
          );
        }
        output.push('Nmap done: 1 IP address (1 host up) scanned in 3.12 seconds');
      } else if (targetIp === '10.0.8.35') {
        // Decoy test
        output = [
          'Starting Nmap 7.92 ( https://nmap.org ) at 2026-07-05 00:33 UTC',
          'Nmap scan report for 10.0.8.35 (db-secure.local)',
          'Host is up (0.0039s latency).'
        ];

        if (isDecoy) {
          output.push(
            'PORT     STATE SERVICE',
            '3306/tcp open  mysql',
            'Note: Multiple decoys successfully masked your real IP in the database audit log.'
          );
        } else {
          output.push(
            'WARNING: Scan origin detected by Security Incident Monitor (SIEM)!',
            'Alert: Source IP 10.0.8.5 is scanning high-security zone.',
            'Action: Blocking scan requests. All ports are reported as: closed'
          );
        }
        output.push('Nmap done: 1 IP address (1 host up) scanned in 2.22 seconds');
      } else if (targetIp === '10.0.8.99') {
        // IDS timing test
        output = [
          'Starting Nmap 7.92 ( https://nmap.org ) at 2026-07-05 00:34 UTC'
        ];

        if (isTimingPolite) {
          setIdsBanned(false);
          output.push(
            'Nmap scan report for 10.0.8.99 (ids-web.local)',
            'Host is up (0.0061s latency).',
            'PORT   STATE SERVICE',
            '80/tcp open  http',
            'Note: Scanned with Polite timing template. IDS threshold was not triggered.'
          );
        } else if (isTimingFast || (!isTimingPolite && !isPingScan)) {
          setIdsBanned(true);
          output.push(
            '!!! WARNING !!! INTRUSION DETECTION SYSTEM (IDS) ALERT TRIGGERED!',
            'Reason: Aggressive/Fast TCP SYN port scanning frequency exceeded.',
            'Action: Banning Source IP 10.0.8.5 immediately for 5 minutes.',
            'Result: Connection closed. Scan terminated early.',
            'Error: Failed to fetch ports from 10.0.8.99.'
          );
        } else {
          output.push(
            'Nmap scan report for 10.0.8.99 (ids-web.local)',
            'Host is up (0.0060s latency).',
            'Note: Ping discovery only. Run port scans with careful timing to avoid IDS blocks.'
          );
        }
        output.push('Nmap done: 1 IP address scanned in 4.55 seconds');
      } else {
        output = [
          'Starting Nmap 7.92 ( https://nmap.org ) at 2026-07-05 00:35 UTC',
          `Nmap scan report for ${targetIp}`,
          'Host seems down or is not responding. If it is really up, but blocking our ping probes, try with -Pn',
          `Nmap done: 1 IP address (0 hosts up) scanned in 2.05 seconds`
        ];
      }
    } else {
      output = [
        `bash: ${base}: command not found`,
        'Type "help" to see available sandbox commands.'
      ];
    }

    setTerminalLogs(prev => [...prev, ...output, '']);
    setIsCommandRunning(false);
  };

  // Handle command submissions
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCommandRunning) return;
    executeCommand(currentCommand);
  };

  // Keyboard controls in Terminal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = Math.min(historyIdx + 1, commandHistory.length - 1);
        setHistoryIdx(nextIdx);
        setCurrentCommand(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = historyIdx - 1;
      setHistoryIdx(nextIdx);
      if (nextIdx >= 0) {
        setCurrentCommand(commandHistory[nextIdx]);
      } else {
        setCurrentCommand('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for target commands
      const current = currentCommand.trim();
      if (current === 'nm') {
        setCurrentCommand('nmap ');
      } else if (current === 'nmap') {
        setCurrentCommand('nmap ');
      } else if (current === 'pi') {
        setCurrentCommand('ping ');
      } else if (current === 'cu') {
        setCurrentCommand('curl ');
      } else if (current.includes('192.168.1.')) {
        // Auto complete the target IP
        const prefix = current.substring(0, current.lastIndexOf(' ') + 1);
        setCurrentCommand(prefix + '192.168.1.45');
      } else if (current.includes('10.0.8.')) {
        const prefix = current.substring(0, current.lastIndexOf(' ') + 1);
        if (currentIdx === 7) {
          setCurrentCommand(prefix + '10.0.8.20');
        } else if (currentIdx === 8) {
          setCurrentCommand(prefix + '10.0.8.35');
        } else if (currentIdx === 9) {
          setCurrentCommand(prefix + '10.0.8.99');
        }
      }
    }
  };

  // Check if user has answered all questions to show a master badge
  const allCompleted = QUESTIONS.every(q => completed[q.id]);

  return (
    <div id="nmap-trainer-app" className="w-full h-full bg-[#0a0a0c] text-gray-200 flex flex-col font-sans overflow-hidden">
      
      {/* ─── HEADER BAR ─── */}
      <div className="bg-[#121215] border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-red-600/10 p-1.5 rounded-lg border border-red-500/20 text-red-500">
            <Terminal size={18} />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white">Nmap Practice Terminal</span>
            <span className="text-[10px] text-gray-500 font-mono ml-2 uppercase tracking-widest">THM-Style Lab</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/45 px-3 py-1 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-mono font-bold">
              進捗: {Object.keys(completed).length} / 10
            </span>
          </div>

          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ─── SPLIT LAYOUT CONTAINER ─── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        
        {/* ─── LEFT: LAB MATERIAL & TASKS ─── */}
        <div className="w-1/2 border-r border-white/5 flex flex-col bg-[#0d0d10] overflow-y-auto">
          
          {/* Question Map Tabs */}
          <div className="bg-[#101013] border-b border-white/5 px-4 py-2 flex gap-1 items-center overflow-x-auto shrink-0 scrollbar-none">
            {QUESTIONS.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIdx(idx);
                  setShowHint(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                  currentIdx === idx
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/15'
                    : completed[q.id]
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                      : 'bg-black/30 text-gray-400 border border-white/5 hover:text-white hover:bg-black/50'
                }`}
              >
                {completed[q.id] ? '✓' : ''} Q{q.id}
              </button>
            ))}
          </div>

          {/* Active Question Content */}
          <div className="p-5 flex-1 space-y-5">
            
            {/* Title & Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-gray-500 font-mono uppercase tracking-widest">
                  TASK 0{activeQuestion.id} / 10
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">{activeQuestion.title}</h2>
              </div>
              <span className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold tracking-wider uppercase border ${
                activeQuestion.difficulty === 'Easy'
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                  : activeQuestion.difficulty === 'Medium'
                    ? 'bg-amber-950/50 border-amber-500/30 text-amber-400'
                    : 'bg-red-950/50 border-red-500/30 text-red-400'
              }`}>
                {activeQuestion.difficulty}
              </span>
            </div>

            {/* Description (Learn section) */}
            <div className="bg-[#111115] p-4 rounded-xl border border-white/5 text-xs text-gray-300 leading-relaxed space-y-3 shadow">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block font-mono">📘 学習用解説</span>
              <p className="whitespace-pre-line">{activeQuestion.description}</p>
            </div>

            {/* Nmap Command Target Card (to help copying / understanding target) */}
            <div className="bg-[#141419] p-3 rounded-lg border border-red-500/10 flex justify-between items-center text-xs">
              <div>
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider block">Target Host</span>
                <span className="font-mono text-white font-bold">{activeQuestion.id <= 7 ? '192.168.1.45' : activeQuestion.id === 8 ? '10.0.8.20' : activeQuestion.id === 9 ? '10.0.8.35' : '10.0.8.99'}</span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider block">Security Rule</span>
                <span className="text-[9px] font-bold font-mono text-amber-400 uppercase">
                  {activeQuestion.id <= 7 ? 'None (Local Subnet)' : activeQuestion.id === 8 ? 'Stateless Packet FW' : activeQuestion.id === 9 ? 'Audit Log SIEM' : 'Rate-Limit IDS'}
                </span>
              </div>
            </div>

            {/* Practical Task */}
            <div className="border-l-4 border-red-500 pl-4 space-y-2">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">🎯 ミッション</span>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">{activeQuestion.task}</p>
            </div>

            {/* Answer Box */}
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">解答の提出</label>
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-[10px] text-gray-400 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <HelpCircle size={12} />
                  <span>ヒント</span>
                </button>
              </div>

              {showHint && (
                <div className="text-[10px] bg-red-950/20 text-red-300 border border-red-900/30 rounded p-2.5 leading-relaxed">
                  <strong className="text-red-400 font-bold block mb-1 font-mono">HINT:</strong>
                  {activeQuestion.hint}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={userAnswers[activeQuestion.id] || ''}
                  onChange={(e) => setUserAnswers({ ...userAnswers, [activeQuestion.id]: e.target.value })}
                  placeholder={activeQuestion.placeholder}
                  className="bg-[#121215] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50 flex-1 font-mono"
                  disabled={completed[activeQuestion.id]}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitAnswer(activeQuestion.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleSubmitAnswer(activeQuestion.id)}
                  disabled={completed[activeQuestion.id]}
                  className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${
                    completed[activeQuestion.id]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {completed[activeQuestion.id] ? (
                    <>
                      <CheckCircle size={14} />
                      <span>正解</span>
                    </>
                  ) : (
                    <span>送信</span>
                  )}
                </button>
              </div>

              {showFeedback[activeQuestion.id] && (
                <div className={`p-3 rounded-lg text-[10px] border leading-normal transition-all ${
                  showFeedback[activeQuestion.id]?.success
                    ? 'bg-emerald-950/30 text-emerald-300 border-emerald-900/30'
                    : 'bg-red-950/30 text-red-300 border-red-900/30'
                }`}>
                  {showFeedback[activeQuestion.id]?.msg}
                </div>
              )}
            </div>

            {/* Learn More section */}
            <div className="bg-[#131316]/50 p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-[9px] font-bold text-gray-500 font-mono uppercase tracking-widest block">💡 技術的トリビア</span>
              <p className="text-[11px] text-gray-400 leading-relaxed leading-normal">{activeQuestion.learnMore}</p>
            </div>

          </div>

          {/* Master Certificate Overlay when all completed */}
          {allCompleted && (
            <div className="m-5 bg-gradient-to-r from-red-950/40 to-amber-950/40 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4 shadow-xl">
              <div className="inline-block bg-amber-500/10 p-3 rounded-full border border-amber-500/30 text-amber-500 animate-pulse">
                <Award size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-base tracking-tight">Nmapマスター認定証！</h3>
                <p className="text-gray-300 text-xs leading-normal">おめでとうございます！10問すべての難関セキュリティ突破ミッションを完遂し、Nmapとファイアーウォールバイパスの基本を習得しました。</p>
              </div>
              <div className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-widest">
                🏆 SECURITY PEN-TEST MASTER BADGE EARNED
              </div>
            </div>
          )}

        </div>

        {/* ─── RIGHT: INTERACTIVE TERMINAL EMULATOR ─── */}
        <div 
          onClick={handleTerminalClick}
          className="w-1/2 bg-black flex flex-col font-mono text-xs p-4 overflow-hidden relative cursor-text"
        >
          {/* Watermark indicators in terminal margin */}
          <div className="absolute top-3 right-4 flex items-center gap-1.5 text-gray-700 select-none">
            <Cpu size={12} />
            <span className="text-[9px] uppercase tracking-wider font-bold">Lab Host: 10.0.8.5 (Kali OS)</span>
          </div>

          {/* Terminal Logs container */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
            {terminalLogs.map((log, i) => {
              if (log.startsWith('$')) {
                return (
                  <div key={i} className="text-red-400 font-bold flex items-center gap-1.5 mt-2">
                    <span className="text-gray-600 select-none">kali@thm-lab:~$</span>
                    <span>{log.substring(2)}</span>
                  </div>
                );
              }
              if (log.includes('WARNING') || log.includes('ALERT') || log.includes('VULNERABLE:')) {
                return (
                  <div key={i} className="text-amber-400 whitespace-pre-wrap leading-relaxed py-0.5">
                    {log}
                  </div>
                );
              }
              if (log.includes('open') && log.includes('tcp')) {
                return (
                  <div key={i} className="text-emerald-400 font-bold whitespace-pre-wrap leading-relaxed">
                    {log}
                  </div>
                );
              }
              return (
                <div key={i} className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {log}
                </div>
              );
            })}
            
            {/* Command execution waiting spinner */}
            {isCommandRunning && (
              <div className="text-gray-500 italic flex items-center gap-2 animate-pulse mt-1">
                <RefreshCw size={12} className="animate-spin text-red-500" />
                <span>Scanning target host... (ICMP / TCP Handshake probes in progress)</span>
              </div>
            )}
            
            <div ref={logsEndRef} />
          </div>

          {/* Prompt line */}
          <form 
            onSubmit={handleCommandSubmit}
            className="flex items-center gap-1.5 border-t border-white/5 pt-3 shrink-0"
          >
            <span className="text-red-500 font-bold select-none">kali@thm-lab:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none text-white focus:outline-none flex-1 font-mono font-bold"
              placeholder="ここにコマンドを入力... (Tabキーで補完)"
              disabled={isCommandRunning}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </form>

        </div>

      </div>

    </div>
  );
}
