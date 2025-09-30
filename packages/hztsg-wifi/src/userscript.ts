async function main() {
  let username = await GM.getValue<string>('username')
  if (!username) {
    const result = prompt('Please enter your library account:')
    if (!result) {
      alert('No account entered, script terminated')
      return
    }
    await GM.setValue('username', result)
    username = result
  }
  let password = await GM.getValue<string>('password')
  if (!password) {
    const result = prompt('Please enter your library password:')
    if (!result) {
      alert('No password entered, script terminated')
      return
    }
    await GM.setValue('password', result)
    password = result
  }

  const $name = document.querySelector('#password_name') as HTMLInputElement
  $name.value = username
  const $pwd = document.querySelector('#password_pwd') as HTMLInputElement
  $pwd.value = password
  const $remeber = document.querySelector('#rememberPwd') as HTMLInputElement
  $remeber.checked = true
  const $password_disclaimer = document.querySelector('#password_disclaimer') as HTMLInputElement
  $password_disclaimer.checked = true
  const $submitBtn = document.querySelector('#password_submitBtn') as HTMLButtonElement
  $submitBtn.click()
  setTimeout(() => {
    window.close()
  }, 1000)
}

main()
