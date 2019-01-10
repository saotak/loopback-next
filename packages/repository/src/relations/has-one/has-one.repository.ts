// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Getter} from '@loopback/context';
import {DataObject, Options, Count} from '../../common-types';
import {Entity} from '../../model';
import {Filter, Where} from '../../query';
import {
  constrainDataObject,
  constrainFilter,
  EntityCrudRepository,
  constrainWhere,
} from '../../repositories';
import {EntityNotFoundError} from '../../errors';

/**
 * CRUD operations for a target repository of a HasMany relation
 */
export interface HasOneRepository<Target extends Entity> {
  /**
   * Create a target model instance
   * @param targetModelData The target model data
   * @param options Options for the operation
   * @returns A promise which resolves to the newly created target model instance
   */
  create(
    targetModelData: DataObject<Target>,
    options?: Options,
  ): Promise<Target>;

  /**
   * Find the only target model instance that belongs to the declaring model.
   * @param filter Query filter without a Where condition
   * @param options Options for the operations
   * @returns A promise of the target object or null if not found.
   */
  get(
    filter?: Pick<Filter<Target>, Exclude<keyof Filter<Target>, 'where'>>,
    options?: Options,
  ): Promise<Target>;

  /**
   * Patch related target model instance
   * @param dataObject The target model fields and their new values to patch
   * @param options
   * @returns A promise which resolves the patched target model instances
   */
  patch(dataObject: DataObject<Target>, options?: Options): Promise<Count>;
}

export class DefaultHasOneRepository<
  TargetEntity extends Entity,
  TargetID,
  TargetRepository extends EntityCrudRepository<TargetEntity, TargetID>
> implements HasOneRepository<TargetEntity> {
  /**
   * Constructor of DefaultHasOneEntityCrudRepository
   * @param getTargetRepository the getter of the related target model repository instance
   * @param constraint the key value pair representing foreign key name to constrain
   * the target repository instance
   */
  constructor(
    public getTargetRepository: Getter<TargetRepository>,
    public constraint: DataObject<TargetEntity>,
  ) {}

  async create(
    targetModelData: DataObject<TargetEntity>,
    options?: Options,
  ): Promise<TargetEntity> {
    const targetRepository = await this.getTargetRepository();
    return await targetRepository.create(
      constrainDataObject(targetModelData, this.constraint),
      options,
    );
  }

  async get(
    filter?: Pick<
      Filter<TargetEntity>,
      Exclude<keyof Filter<TargetEntity>, 'where'>
    >,
    options?: Options,
  ): Promise<TargetEntity> {
    const targetRepository = await this.getTargetRepository();
    const found = await targetRepository.find(
      Object.assign({limit: 1}, constrainFilter(filter, this.constraint)),
      options,
    );
    if (found.length < 1) {
      // We don't have a direct access to the foreign key value here :(
      const id = 'constraint ' + JSON.stringify(this.constraint);
      throw new EntityNotFoundError(targetRepository.entityClass, id);
    }
    return found[0];
  }

  async patch(
    dataObject: DataObject<TargetEntity>,
    options?: Options,
  ): Promise<Count> {
    const targetRepository = await this.getTargetRepository();
    const entity = targetRepository.entityClass;
    return await targetRepository.updateAll(
      dataObject,
      constrainWhere({}, this.constraint as Where<TargetEntity>),
    );
  }
}
