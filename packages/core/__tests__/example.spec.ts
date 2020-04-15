/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dx, DxModel, DxFactory } from '../src';
import { Reducer, Effect } from '../../common/src';
import { DxModelInterface, DxModelContstructor } from '@dxjs/shared/interfaces/dx-model.interface';

describe('Dxjs example', () => {
  function delayGet(value: any = 10): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => resolve(value), 1000);
    });
  }

  let _Dx = Dx;
  let ExampleModelStatic: DxModelContstructor;

  beforeAll(() => {
    class ExampleModel extends DxModel implements DxModelInterface {
      state = { count: 1 };

      @Reducer()
      updateCount(count: number): void {
        this.state.count += count;
      }

      @Effect()
      *asyncUpdateCount(payload: number): any {
        const count = yield this.$call(delayGet, payload);
        yield this.$put(ExampleModelStatic.updateCount(count));
      }
    }

    ExampleModelStatic = ExampleModel;
  });

  beforeEach(() => {
    _Dx = DxFactory();
  });

  it('通过 collect 之后，自动设置 state', () => {
    _Dx.collect()(ExampleModelStatic);
    expect(_Dx.createStore().getState()).toMatchObject({ ExampleModel: { count: 1 } });
  });

  it('通过 collect 之后，自动设置 state, 设置 model 别名', () => {
    _Dx.collect('example')(ExampleModelStatic);
    expect(_Dx.createStore().getState()).toMatchObject({ example: { count: 1 } });
  });

  it('自动生成 action', () => {
    _Dx.collect('example')(ExampleModelStatic);
    _Dx.createStore();
    const actions = ['asyncUpdateCount', 'updateCount'];
    expect(actions.every(actionKey => typeof ExampleModelStatic[actionKey] === 'function')).toBe(
      true,
    );
  });

  it('自动生成 action, 返回 action type', () => {
    _Dx.collect('example')(ExampleModelStatic);
    _Dx.createStore();
    expect(ExampleModelStatic.updateCount(2)).toMatchObject({ payload: 2 });
    // type 是一个 symbol
    expect(typeof ExampleModelStatic.updateCount(2).type === 'symbol').toBe(true);
  });

  it('自动生成 action, 自动 dispatch', () => {
    _Dx.collect('example')(ExampleModelStatic);
    const store = _Dx.createStore();
    ExampleModelStatic.updateCount(2, true);
    expect(store.getState()).toMatchObject({ example: { count: 3 } });
  });

  it('自动生成 action, 自动 dispatch effect', async () => {
    _Dx.collect('example')(ExampleModelStatic);
    const store = _Dx.createStore();
    ExampleModelStatic.asyncUpdateCount(10, true);
    await delayGet();
    expect(store.getState()).toMatchObject({ example: { count: 11 } });
  });
});
