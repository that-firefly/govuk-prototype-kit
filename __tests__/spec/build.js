/* eslint-env jest */

const fse = require('fs-extra')
const fs = require('graceful-fs') // fs-extra uses graceful-fs, so we need to mock that instead of fs
const path = require('path')

const del = require('del')
const sass = require('sass')

const { projectDir } = require('../../lib/path-utils')
const { generateAssetsSync } = require('../../lib/build/tasks')

describe('the build pipeline', () => {
  describe('generate assets', () => {
    beforeAll(() => {
      expect(
        fs.existsSync(path.join('app', 'assets', 'test'))
      ).toBe(false)

      jest.spyOn(fs, 'chmodSync').mockImplementation(() => {})
      jest.spyOn(fse, 'chmodSync').mockImplementation(() => {})
      jest.spyOn(fs, 'copyFileSync').mockImplementation(() => {})
      jest.spyOn(fse, 'copyFileSync').mockImplementation(() => {})
      jest.spyOn(fse, 'ensureDirSync').mockImplementation(() => {})
      jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {})
      jest.spyOn(fse, 'mkdirSync').mockImplementation(() => {})
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      jest.spyOn(fse, 'writeFileSync').mockImplementation(() => {})

      jest.spyOn(sass, 'compile').mockImplementation((css, options) => ({ css }))

      generateAssetsSync()
    })

    afterAll(() => {
      jest.restoreAllMocks()

      del([path.join('app', 'assets', 'test')])
    })

    it('makes the extensions sass file', () => {
      expect(fse.ensureDirSync).toHaveBeenCalledWith(
        path.join(projectDir, '.tmp', 'sass'), { recursive: true }
      )

      expect(fse.writeFileSync).toHaveBeenCalledWith(
        path.join(projectDir, '.tmp', '.gitignore'),
        '*'
      )

      expect(fse.writeFileSync).toHaveBeenCalledWith(
        path.join(projectDir, '.tmp', 'sass', '_extensions.scss'),
        expect.stringContaining('$govuk-extensions-url-context')
      )
    })

    it('compiles sass', () => {
      const options = {
        quietDeps: true,
        loadPaths: [projectDir],
        sourceMap: true,
        style: 'expanded'
      }
      expect(sass.compile).toHaveBeenCalledWith(expect.stringContaining(path.join(projectDir, 'lib', 'assets', 'sass', 'prototype.scss')), expect.objectContaining(options))

      expect(fse.writeFileSync).toHaveBeenCalledWith(
        path.join('.tmp', 'public', 'stylesheets', 'application.css'),
        path.join(projectDir, 'lib', 'assets', 'sass', 'prototype.scss')
      )

      expect(sass.compile).not.toHaveBeenCalledWith(expect.stringContaining(path.join('app', 'assets', 'sass', 'application.scss')), expect.objectContaining(options))
    })
  })
})
