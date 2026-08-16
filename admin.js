(() => {
  'use strict';

  let birds = [];
  let currentRing = '';
  let adminToken =
    sessionStorage.getItem('yunotsubasa_admin_token') || '';

  const app = document.getElementById('app');

  app.innerHTML = `
    <header class="admin-header">
      <div class="admin-header-inner">
        <div>
          <div class="brand-main">優乃翼</div>
          <div class="brand-sub">レース鳩データベース管理</div>
        </div>
        <button id="headerLogout" class="header-logout" type="button">ログアウト</button>
      </div>
    </header>

    <main class="admin-main">

      <section id="loginPanel" class="login-card">
        <h1>管理者ログイン</h1>
        <p>管理者パスワードを入力してください。</p>
        <input id="password" type="password" autocomplete="current-password" placeholder="パスワード">
        <button id="loginButton" class="primary-button" type="button">ログイン</button>
        <div id="loginMessage" class="message"></div>
      </section>

      <section id="adminPanel" hidden>
        <div class="tabs">
          <button id="listTab" class="tab-button active" type="button">登録鳩一覧</button>
          <button id="newTab" class="tab-button" type="button">＋ 新規登録</button>
        </div>

        <section id="listPanel" class="panel">
          <div class="search-wrap">
            <input id="search" class="search-input" placeholder="脚環番号・個体名・血統など">
          </div>
          <div id="birdList">読み込み中…</div>
        </section>

        <section id="formPanel" class="panel" hidden>
          <form id="birdForm">

            <div class="form-header">
              <button id="backButton" class="back-button" type="button" aria-label="一覧へ戻る">‹</button>
              <h2 id="formTitle" class="form-title">新しい鳩を登録</h2>
            </div>

            <input type="hidden" name="管理ID">

            <div class="form-grid">

              <label class="field">
                <span class="field-label">脚環番号 *</span>
                <input name="脚環番号" required autocomplete="off">
              </label>

              <label class="field">
                <span class="field-label">個体名</span>
                <input name="個体名">
              </label>

              <label class="field">
                <span class="field-label">性別</span>
                <select name="性別">
                  <option value="">未選択</option>
                  <option>♂</option>
                  <option>♀</option>
                  <option>不明</option>
                </select>
              </label>

              <label class="field">
                <span class="field-label">羽色</span>
                <input name="羽色">
              </label>

              <label class="field">
                <span class="field-label">作出年</span>
                <input name="作出年" inputmode="numeric">
              </label>

              <label class="field">
                <span class="field-label">作出者</span>
                <input name="作出者">
              </label>

              <label class="field">
                <span class="field-label">父</span>
                <input name="父">
              </label>

              <label class="field">
                <span class="field-label">母</span>
                <input name="母">
              </label>

              <label class="field">
                <span class="field-label">父方祖父</span>
                <input name="父方祖父">
              </label>

              <label class="field">
                <span class="field-label">父方祖母</span>
                <input name="父方祖母">
              </label>

              <label class="field">
                <span class="field-label">母方祖父</span>
                <input name="母方祖父">
              </label>

              <label class="field">
                <span class="field-label">母方祖母</span>
                <input name="母方祖母">
              </label>

              <label class="field wide">
                <span class="field-label">競翔成績</span>
                <textarea name="競翔成績"></textarea>
              </label>

              <label class="field wide">
                <span class="field-label">血統・特徴</span>
                <textarea name="血統・特徴"></textarea>
              </label>

              <label class="field">
                <span class="field-label">価格</span>
                <input name="価格" inputmode="numeric" placeholder="例：50000">
              </label>

              <label class="field">
                <span class="field-label">状態</span>
                <select name="状態">
                  <option>販売中</option>
                  <option>商談中</option>
                  <option>売約済</option>
                  <option>非売品</option>
                </select>
              </label>

              <div class="field wide upload-box">
                <span class="field-label">鳩写真</span>
                <input id="birdImage" type="file" accept="image/*">
                <img id="birdPreview" class="preview" alt="鳩写真プレビュー">
                <input class="url-input" name="鳩画像URL" placeholder="画像URL">
              </div>

              <div class="field wide upload-box">
                <span class="field-label">血統書画像</span>
                <input id="pedigreeImage" type="file" accept="image/*">
                <img id="pedigreePreview" class="preview" alt="血統書プレビュー">
                <input class="url-input" name="血統書画像URL" placeholder="血統書URL">
              </div>

              <label class="field wide">
                <span class="field-label">備考</span>
                <textarea name="備考"></textarea>
              </label>

            </div>

            <div id="message" class="message"></div>

            <div class="desktop-save">
              <button id="saveButton" class="primary-button" type="submit">保存する</button>
            </div>

            <button id="deleteButton" class="delete-button" type="button" hidden>この鳩を削除</button>

          </form>
        </section>
      </section>
    </main>

    <div id="mobileSavebar" class="mobile-savebar">
      <button id="mobileSaveButton" type="button">保存する</button>
    </div>
  `;

  const el = id => document.getElementById(id);

  const loginPanel = el('loginPanel');
  const adminPanel = el('adminPanel');
  const listPanel = el('listPanel');
  const formPanel = el('formPanel');
  const form = el('birdForm');
  const mobileSavebar = el('mobileSavebar');

  function getErrorMessage(error) {
    if (error && error.message) return error.message;
    return String(error || 'エラーが発生しました。');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    })[c]);
  }

  function setLoginMessage(text, type = '') {
    const box = el('loginMessage');
    box.textContent = text || '';
    box.className = 'message' + (type ? ' ' + type : '');
  }

  function setMessage(text, type = '') {
    const box = el('message');
    box.textContent = text || '';
    box.className = 'message' + (type ? ' ' + type : '');
  }

  function showLogin() {
    loginPanel.hidden = false;
    adminPanel.hidden = true;
    el('headerLogout').style.display = 'none';
    mobileSavebar.classList.remove('show');
  }

  function showAdmin() {
    loginPanel.hidden = true;
    adminPanel.hidden = false;
    el('headerLogout').style.display = '';
  }

  function login() {
    const password = el('password').value;

    setLoginMessage('確認中…');

    google.script.run
      .withSuccessHandler(result => {
        adminToken = result.token;
        sessionStorage.setItem('yunotsubasa_admin_token', adminToken);
        el('password').value = '';
        setLoginMessage('');
        showAdmin();
        loadBirds();
      })
      .withFailureHandler(error => {
        setLoginMessage(getErrorMessage(error), 'error');
      })
      .login(password);
  }

  function logout() {
    const token = adminToken;

    adminToken = '';
    sessionStorage.removeItem('yunotsubasa_admin_token');

    if (token) {
      google.script.run.logout(token);
    }

    showLogin();
  }

  function authError(error) {
    const message = getErrorMessage(error);

    if (
      message.includes('ログイン') ||
      message.includes('有効期限')
    ) {
      adminToken = '';
      sessionStorage.removeItem('yunotsubasa_admin_token');
      showLogin();
      setLoginMessage(message, 'error');
      return;
    }

    setMessage(message, 'error');
  }

  function loadBirds() {
    el('birdList').innerHTML = '読み込み中…';

    google.script.run
      .withSuccessHandler(data => {
        birds = data || [];
        renderBirds();
      })
      .withFailureHandler(authError)
      .getBirds(adminToken);
  }

  function renderBirds() {
    const keyword = el('search').value.toLowerCase();

    const filtered = birds.filter(bird =>
      Object.values(bird).join(' ').toLowerCase().includes(keyword)
    );

    if (!filtered.length) {
      el('birdList').innerHTML =
        '<div class="empty">登録鳩がありません。</div>';
      return;
    }

    el('birdList').innerHTML = filtered.map(bird => {
      const ringRaw = bird['脚環番号'] || '';
      const ring = escapeHtml(ringRaw);
      const name = escapeHtml(bird['個体名'] || '');

      const meta = escapeHtml(
        [
          bird['性別'],
          bird['羽色'],
          bird['作出年'],
          bird['状態']
        ].filter(Boolean).join(' ／ ')
      );

      return `
        <div class="bird-row">
          <div>
            <div class="ring">${ring}</div>
            <div class="bird-name">${name}</div>
            <div class="meta">${meta}</div>
          </div>
          <button
            class="edit-button"
            type="button"
            data-ring="${escapeHtml(ringRaw)}"
          >
            編集
          </button>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.edit-button').forEach(button => {
      button.addEventListener('click', () => {
        editBird(button.dataset.ring);
      });
    });
  }

  function clearPreview(id) {
    const img = el(id);
    img.removeAttribute('src');
    img.classList.remove('show');
  }

  function clearPreviews() {
    clearPreview('birdPreview');
    clearPreview('pedigreePreview');
  }

  function drivePreviewUrl(url) {
    const text = String(url || '');
    if (!text) return '';

    const match =
      text.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      text.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (match) {
      return 'https://drive.google.com/thumbnail?id=' +
        match[1] +
        '&sz=w1200';
    }

    return text;
  }

  function showExistingImage(id, url) {
    const img = el(id);
    const src = drivePreviewUrl(url);

    if (!src) {
      clearPreview(id);
      return;
    }

    img.src = src;
    img.classList.add('show');
  }

  function newBird() {
    currentRing = '';
    form.reset();
    clearPreviews();

    el('formTitle').textContent = '新しい鳩を登録';
    el('deleteButton').hidden = true;

    setMessage('');
    showForm();
  }

  function editBird(ring) {
    const bird = birds.find(item =>
      String(item['脚環番号']) === String(ring)
    );

    if (!bird) return;

    currentRing = ring;

    form.reset();

    [...form.elements].forEach(element => {
      if (!element.name) return;

      if (bird[element.name] !== undefined) {
        element.value = bird[element.name] || '';
      }
    });

    el('formTitle').textContent = '登録鳩を編集';
    el('deleteButton').hidden = false;

    showExistingImage('birdPreview', bird['鳩画像URL']);
    showExistingImage('pedigreePreview', bird['血統書画像URL']);

    setMessage('');
    showForm();
  }

  function showList() {
    listPanel.hidden = false;
    formPanel.hidden = true;

    el('listTab').classList.add('active');
    el('newTab').classList.remove('active');

    mobileSavebar.classList.remove('show');

    window.scrollTo({top:0, behavior:'smooth'});
  }

  function showForm() {
    listPanel.hidden = true;
    formPanel.hidden = false;

    el('listTab').classList.remove('active');
    el('newTab').classList.add('active');

    mobileSavebar.classList.add('show');

    window.scrollTo({top:0, behavior:'smooth'});
  }

  function setSaving(isSaving) {
    el('saveButton').disabled = isSaving;
    el('mobileSaveButton').disabled = isSaving;

    const text = isSaving ? '保存しています…' : '保存する';

    el('saveButton').textContent = text;
    el('mobileSaveButton').textContent = text;
  }

  function uploadFile(file, type) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64 = String(reader.result).split(',')[1];

        const runner = google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject);

        if (type === 'bird') {
          runner.uploadBirdImage(
            adminToken,
            base64,
            file.type,
            file.name
          );
        } else {
          runner.uploadPedigreeImage(
            adminToken,
            base64,
            file.type,
            file.name
          );
        }
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function saveBird(event) {
    event.preventDefault();

    setSaving(true);
    setMessage('保存しています…');

    try {
      const data = Object.fromEntries(new FormData(form).entries());

      const birdFile = el('birdImage').files[0];
      if (birdFile) {
        const result = await uploadFile(birdFile, 'bird');
        data['鳩画像URL'] = result.url;
      }

      const pedigreeFile = el('pedigreeImage').files[0];
      if (pedigreeFile) {
        const result = await uploadFile(pedigreeFile, 'pedigree');
        data['血統書画像URL'] = result.url;
      }

      google.script.run
        .withSuccessHandler(result => {
          setSaving(false);
          setMessage(result.message || '保存しました。', 'success');
          loadBirds();

          setTimeout(() => {
            showList();
          }, 500);
        })
        .withFailureHandler(error => {
          setSaving(false);
          authError(error);
        })
        .saveBird(adminToken, data);

    } catch (error) {
      setSaving(false);
      authError(error);
    }
  }

  function deleteBird() {
    if (!currentRing) return;

    if (!confirm(currentRing + ' を削除しますか？')) {
      return;
    }

    el('deleteButton').disabled = true;

    google.script.run
      .withSuccessHandler(() => {
        el('deleteButton').disabled = false;
        loadBirds();
        showList();
      })
      .withFailureHandler(error => {
        el('deleteButton').disabled = false;
        authError(error);
      })
      .deleteBird(adminToken, currentRing);
  }

  function setLocalPreview(fileInputId, previewId) {
    const input = el(fileInputId);
    const img = el(previewId);

    input.addEventListener('change', () => {
      const file = input.files[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        img.src = reader.result;
        img.classList.add('show');
      };

      reader.readAsDataURL(file);
    });
  }

  el('loginButton').addEventListener('click', login);

  el('password').addEventListener('keydown', event => {
    if (event.key === 'Enter') login();
  });

  el('headerLogout').addEventListener('click', logout);
  el('listTab').addEventListener('click', showList);
  el('newTab').addEventListener('click', newBird);
  el('backButton').addEventListener('click', showList);
  el('search').addEventListener('input', renderBirds);
  el('deleteButton').addEventListener('click', deleteBird);

  form.addEventListener('submit', saveBird);

  el('mobileSaveButton').addEventListener('click', () => {
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      el('saveButton').click();
    }
  });

  setLocalPreview('birdImage', 'birdPreview');
  setLocalPreview('pedigreeImage', 'pedigreePreview');

  if (adminToken) {
    showAdmin();
    loadBirds();
  } else {
    showLogin();
  }

})();
